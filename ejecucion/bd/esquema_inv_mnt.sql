-- Esquema: sch_leangsp
CREATE SCHEMA IF NOT EXISTS sch_leangsp;

-- ==========================================
-- Módulo de Inventario (WMS-Lite)
-- ==========================================

-- Bodegas
CREATE TABLE sch_leangsp.tinv_bodega (
    id_bodega BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'ACTIVA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Productos
CREATE TABLE sch_leangsp.tinv_producto (
    id_producto BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    prefijo_sku VARCHAR(4) NOT NULL,
    correlativo_sku VARCHAR(10) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) NOT NULL,
    categoria VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_prefijo_sku_length CHECK (LENGTH(prefijo_sku) = 4 AND prefijo_sku = UPPER(prefijo_sku)),
    UNIQUE (id_empresa, prefijo_sku, correlativo_sku)
);

-- Existencias
CREATE TABLE sch_leangsp.tinv_existencia (
    id_existencia BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_bodega BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 0,
    lote VARCHAR(50),
    costo_adquisicion NUMERIC(15,2) NOT NULL,
    numero_oc VARCHAR(50) NOT NULL,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',
    CONSTRAINT ck_existencia_costo_positivo CHECK (costo_adquisicion > 0),
    CONSTRAINT ck_existencia_oc_not_null CHECK (numero_oc IS NOT NULL AND numero_oc != '')
);

-- Movimientos
CREATE TABLE sch_leangsp.tinv_movimiento (
    id_movimiento BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_bodega BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    tipo_movimiento VARCHAR(20) NOT NULL, -- EJ: INGRESO, EGRESO, AJUSTE
    cantidad NUMERIC(10,2) NOT NULL,
    referencia VARCHAR(100),
    observacion TEXT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_registro VARCHAR(100) NOT NULL
);

-- Traspasos
CREATE TABLE sch_leangsp.tinv_traspaso (
    id_traspaso BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_bodega_origen BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    id_bodega_destino BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    cantidad NUMERIC(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'SOLICITADO',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion TIMESTAMP
);

-- Stock Seguridad
CREATE TABLE sch_leangsp.tinv_stock_seguridad (
    id_stock_seguridad BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_bodega BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    cantidad_minima NUMERIC(10,2) NOT NULL,
    cantidad_maxima NUMERIC(10,2),
    punto_reorden NUMERIC(10,2) NOT NULL,
    UNIQUE (id_empresa, id_bodega, id_producto)
);

-- ==========================================
-- Módulo de Mantenimiento (OTs)
-- ==========================================

-- Tabla referenciada dummy en caso de no existir
CREATE TABLE IF NOT EXISTS sch_leangsp.tequ_equipo (
    id_equipo BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    codigo VARCHAR(50),
    descripcion VARCHAR(200)
);

-- Órdenes de Trabajo
CREATE TABLE sch_leangsp.tmnt_ot (
    id_ot BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    numero_ot VARCHAR(50) NOT NULL,
    id_equipo BIGINT NOT NULL REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    tipo_mantenimiento VARCHAR(20) NOT NULL,
    estado VARCHAR(20) DEFAULT 'ABIERTA',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_programada TIMESTAMP,
    descripcion_falla TEXT,
    UNIQUE (id_empresa, numero_ot)
);

-- Actividades OT
CREATE TABLE sch_leangsp.tmnt_ot_actividad (
    id_actividad BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_ot BIGINT NOT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot),
    descripcion VARCHAR(200) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP
);

-- Horas Hombre OT
CREATE TABLE sch_leangsp.tmnt_ot_hh (
    id_hh BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_ot BIGINT NOT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot),
    rut_tecnico VARCHAR(20) NOT NULL,
    nombre_tecnico VARCHAR(100),
    horas NUMERIC(5,2) NOT NULL,
    tarifa NUMERIC(10,2),
    fecha_trabajo DATE NOT NULL
);

-- Repuestos OT
CREATE TABLE sch_leangsp.tmnt_ot_repuesto (
    id_ot_repuesto BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_ot BIGINT NOT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot),
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    cantidad_solicitada NUMERIC(10,2) NOT NULL,
    cantidad_entregada NUMERIC(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PENDIENTE'
);

-- Cierre OT
CREATE TABLE sch_leangsp.tmnt_ot_cierre (
    id_cierre BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_ot BIGINT NOT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot) UNIQUE,
    fecha_cierre TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_cierre VARCHAR(100) NOT NULL,
    observacion_final TEXT,
    costo_total_hh NUMERIC(15,2),
    costo_total_repuestos NUMERIC(15,2)
);

-- ==========================================
-- Triggers y Funciones PL/pgSQL
-- ==========================================

-- Función para bloquear cierre de OT
CREATE OR REPLACE FUNCTION sch_leangsp.fn_chk_cierre_ot()
RETURNS TRIGGER AS $$
DECLARE
    v_actividades_pendientes INT;
    v_repuestos_pendientes INT;
BEGIN
    -- Validar Update sobre tmnt_ot
    IF TG_TABLE_NAME = 'tmnt_ot' AND NEW.estado = 'CERRADA' AND OLD.estado != 'CERRADA' THEN
        SELECT COUNT(*) INTO v_actividades_pendientes
        FROM sch_leangsp.tmnt_ot_actividad
        WHERE id_ot = NEW.id_ot AND estado != 'COMPLETADA';

        IF v_actividades_pendientes > 0 THEN
            RAISE EXCEPTION 'No se puede cerrar la OT % porque tiene actividades pendientes.', NEW.numero_ot;
        END IF;

        SELECT COUNT(*) INTO v_repuestos_pendientes
        FROM sch_leangsp.tmnt_ot_repuesto
        WHERE id_ot = NEW.id_ot AND cantidad_entregada < cantidad_solicitada;

        IF v_repuestos_pendientes > 0 THEN
            RAISE EXCEPTION 'No se puede cerrar la OT % porque tiene repuestos pendientes.', NEW.numero_ot;
        END IF;
    END IF;

    -- Validar Insert sobre tmnt_ot_cierre
    IF TG_TABLE_NAME = 'tmnt_ot_cierre' THEN
        SELECT COUNT(*) INTO v_actividades_pendientes
        FROM sch_leangsp.tmnt_ot_actividad
        WHERE id_ot = NEW.id_ot AND estado != 'COMPLETADA';

        IF v_actividades_pendientes > 0 THEN
            RAISE EXCEPTION 'No se puede registrar el cierre de la OT (ID: %) porque tiene actividades pendientes.', NEW.id_ot;
        END IF;

        SELECT COUNT(*) INTO v_repuestos_pendientes
        FROM sch_leangsp.tmnt_ot_repuesto
        WHERE id_ot = NEW.id_ot AND cantidad_entregada < cantidad_solicitada;

        IF v_repuestos_pendientes > 0 THEN
            RAISE EXCEPTION 'No se puede registrar el cierre de la OT (ID: %) porque tiene repuestos pendientes.', NEW.id_ot;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tmnt_ot (estado CERRADA)
DROP TRIGGER IF EXISTS trg_chk_cierre_ot_estado ON sch_leangsp.tmnt_ot;
CREATE TRIGGER trg_chk_cierre_ot_estado
BEFORE UPDATE OF estado ON sch_leangsp.tmnt_ot
FOR EACH ROW
EXECUTE FUNCTION sch_leangsp.fn_chk_cierre_ot();

-- Trigger para tmnt_ot_cierre (registro del cierre)
DROP TRIGGER IF EXISTS trg_chk_cierre_ot_registro ON sch_leangsp.tmnt_ot_cierre;
CREATE TRIGGER trg_chk_cierre_ot_registro
BEFORE INSERT ON sch_leangsp.tmnt_ot_cierre
FOR EACH ROW
EXECUTE FUNCTION sch_leangsp.fn_chk_cierre_ot();
