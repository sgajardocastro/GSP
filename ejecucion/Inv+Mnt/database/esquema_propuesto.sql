/*
=============================================================================
Esquema Físico Propuesto - Módulos de Inventario (WMS-Lite) y Mantenimiento (OTs)
Base de Datos: PostgreSQL
Esquema: sch_leangsp
Servidor: servidor.leanglobal.cl
=============================================================================

ERD Diagram (Mermaid):
```mermaid
erDiagram
    TEQU_EQUIPO ||--o{ TMNT_OT : "tiene"
    
    TINV_BODEGA ||--o{ TINV_EXISTENCIA : "almacena"
    TINV_BODEGA ||--o{ TINV_TRASPASO : "origen/destino"
    TINV_BODEGA ||--o{ TINV_STOCK_SEGURIDAD : "define"
    
    TINV_PRODUCTO ||--o{ TINV_EXISTENCIA : "es tipo de"
    TINV_PRODUCTO ||--o{ TINV_STOCK_SEGURIDAD : "requiere"
    TINV_PRODUCTO ||--o{ TMNT_OT_REPUESTO : "planificado en"
    
    TINV_EXISTENCIA ||--o{ TINV_MOVIMIENTO : "registra"
    TINV_EXISTENCIA ||--o| TMNT_OT_REPUESTO : "asignado a"
    
    TMNT_OT ||--o{ TMNT_OT_ACTIVIDAD : "contiene"
    TMNT_OT ||--o{ TMNT_OT_REPUESTO : "usa"
    TMNT_OT ||--o{ TMNT_OT_HH : "registra"
    TMNT_OT ||--o{ TMNT_OT_SERVICIO_EXT : "contrata"
    TMNT_OT ||--o| TMNT_OT_CIERRE : "finaliza con"
```
*/

CREATE SCHEMA IF NOT EXISTS sch_leangsp;
SET search_path TO sch_leangsp;

-- ==========================================================================
-- 1. MÓDULO DE INVENTARIO (WMS-LITE)
-- ==========================================================================

-- 1.1 Tabla: Bodegas
CREATE TABLE tinv_bodega (
    id_bodega BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_sucursal BIGINT NOT NULL, -- FK a la tabla de sucursal o empresa
    consolida_stock BOOLEAN DEFAULT true,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE tinv_bodega IS 'Bodegas físicas o virtuales para WMS-Lite.';

-- 1.2 Tabla: Maestro de Productos / Repuestos
CREATE TABLE tinv_producto (
    id_producto BIGSERIAL PRIMARY KEY,
    codigo_fabricante VARCHAR(100),
    nombre VARCHAR(255) NOT NULL,
    prefijo_sku VARCHAR(4) NOT NULL,
    marca VARCHAR(100),
    tipo_repuesto VARCHAR(50),
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_prefijo_sku_length CHECK (LENGTH(prefijo_sku) = 4 AND prefijo_sku = UPPER(prefijo_sku))
);
COMMENT ON TABLE tinv_producto IS 'Maestro de productos y repuestos.';

-- 1.3 Tabla: Existencias Físicas
CREATE TABLE tinv_existencia (
    id_existencia BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL,
    id_bodega BIGINT NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    codigo_barras VARCHAR(100) UNIQUE NOT NULL,
    costo_adquisicion NUMERIC(15,2) NOT NULL,
    numero_oc VARCHAR(50) NOT NULL,
    numero_factura VARCHAR(50),
    cantidad_disponible INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_disponible >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'EN_TRANSITO', 'ASIGNADA', 'BAJA')),
    ubicacion_fisica VARCHAR(100),
    fecha_ingreso TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_existencia_producto FOREIGN KEY (id_producto) REFERENCES tinv_producto(id_producto),
    CONSTRAINT fk_existencia_bodega FOREIGN KEY (id_bodega) REFERENCES tinv_bodega(id_bodega),
    CONSTRAINT ck_existencia_costo_positivo CHECK (costo_adquisicion > 0),
    CONSTRAINT ck_existencia_oc_not_null CHECK (numero_oc IS NOT NULL AND numero_oc != '')
);
COMMENT ON TABLE tinv_existencia IS 'Instancias físicas unitarias o lotes de un producto en bodega.';

-- 1.4 Tabla: Movimientos de Inventario
CREATE TABLE tinv_movimiento (
    id_movimiento BIGSERIAL PRIMARY KEY,
    id_existencia BIGINT NOT NULL,
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN ('INGRESO', 'DESPACHO', 'TRASPASO_SALIDA', 'TRASPASO_ENTRADA', 'BAJA')),
    id_usuario BIGINT NOT NULL,
    id_ot BIGINT, -- FK a tmnt_ot definida mas abajo
    patente_equipo_destino VARCHAR(20),
    fecha_movimiento TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT NOT NULL,
    costo_imputado NUMERIC(15,2),
    CONSTRAINT fk_movimiento_existencia FOREIGN KEY (id_existencia) REFERENCES tinv_existencia(id_existencia)
);
COMMENT ON TABLE tinv_movimiento IS 'Historial transaccional de existencias.';

-- 1.5 Tabla: Traspasos entre bodegas
CREATE TABLE tinv_traspaso (
    id_traspaso BIGSERIAL PRIMARY KEY,
    id_bodega_origen BIGINT NOT NULL,
    id_bodega_destino BIGINT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_TRANSITO', 'RECIBIDO')),
    fecha_envio TIMESTAMPTZ,
    fecha_recepcion TIMESTAMPTZ,
    id_usuario_envio BIGINT NOT NULL,
    id_usuario_recepcion BIGINT,
    CONSTRAINT fk_traspaso_origen FOREIGN KEY (id_bodega_origen) REFERENCES tinv_bodega(id_bodega),
    CONSTRAINT fk_traspaso_destino FOREIGN KEY (id_bodega_destino) REFERENCES tinv_bodega(id_bodega)
);
COMMENT ON TABLE tinv_traspaso IS 'Cabecera de traspasos de existencias entre bodegas.';

-- 1.6 Tabla: Detalle de Traspaso
CREATE TABLE tinv_traspaso_detalle (
    id_traspaso_detalle BIGSERIAL PRIMARY KEY,
    id_traspaso BIGINT NOT NULL,
    id_existencia BIGINT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    CONSTRAINT fk_traspaso_detalle_traspaso FOREIGN KEY (id_traspaso) REFERENCES tinv_traspaso(id_traspaso) ON DELETE CASCADE,
    CONSTRAINT fk_traspaso_detalle_existencia FOREIGN KEY (id_existencia) REFERENCES tinv_existencia(id_existencia)
);
COMMENT ON TABLE tinv_traspaso_detalle IS 'Líneas de detalle de existencias incluidas en un traspaso.';

-- 1.6 Tabla: Stock de Seguridad
CREATE TABLE tinv_stock_seguridad (
    id_stock_seguridad BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL,
    id_bodega BIGINT NOT NULL,
    nivel_minimo INTEGER NOT NULL CHECK (nivel_minimo >= 0),
    CONSTRAINT fk_stock_producto FOREIGN KEY (id_producto) REFERENCES tinv_producto(id_producto),
    CONSTRAINT fk_stock_bodega FOREIGN KEY (id_bodega) REFERENCES tinv_bodega(id_bodega),
    UNIQUE (id_producto, id_bodega)
);
COMMENT ON TABLE tinv_stock_seguridad IS 'Reglas de nivel de reposición o alerta por bodega y producto.';


-- ==========================================================================
-- 2. MÓDULO DE MANTENIMIENTO (OTs)
-- ==========================================================================

-- 2.1 Tabla: Órdenes de Trabajo (OT)
CREATE TABLE tmnt_ot (
    id_ot BIGSERIAL PRIMARY KEY,
    numero_folio VARCHAR(50) UNIQUE NOT NULL,
    id_equipo BIGINT NOT NULL, -- FK a tequ_equipo (tabla preexistente)
    tipo_mantenimiento VARCHAR(30) NOT NULL CHECK (tipo_mantenimiento IN ('PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO', 'ESPECIAL')),
    estado VARCHAR(30) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS', 'CERRADA')),
    falla_reportada TEXT,
    id_supervisor BIGINT NOT NULL,
    fecha_apertura TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre_real TIMESTAMPTZ,
    horometro_inicio NUMERIC(10,2),
    costo_total_calculado NUMERIC(15,2) DEFAULT 0
    -- CONSTRAINT fk_ot_equipo FOREIGN KEY (id_equipo) REFERENCES tequ_equipo(id_equipo) -- Se asume que tequ_equipo existe en el esquema.
);
COMMENT ON TABLE tmnt_ot IS 'Órdenes de Trabajo principales de mantenimiento de flota.';

-- Añadir la FK faltante en movimientos de inventario ahora que la tabla de OT existe
ALTER TABLE tinv_movimiento
    ADD CONSTRAINT fk_movimiento_ot FOREIGN KEY (id_ot) REFERENCES tmnt_ot(id_ot);

-- 2.2 Tabla: Actividades de la OT
CREATE TABLE tmnt_ot_actividad (
    id_ot_actividad BIGSERIAL PRIMARY KEY,
    id_ot BIGINT NOT NULL,
    descripcion_actividad TEXT NOT NULL,
    horas_estimadas NUMERIC(5,2),
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA')),
    orden INTEGER NOT NULL,
    CONSTRAINT fk_ot_actividad_ot FOREIGN KEY (id_ot) REFERENCES tmnt_ot(id_ot) ON DELETE CASCADE
);
COMMENT ON TABLE tmnt_ot_actividad IS 'Checklist de tareas/actividades planificadas en una OT.';

-- 2.3 Tabla: Repuestos Planificados de la OT
CREATE TABLE tmnt_ot_repuesto (
    id_ot_repuesto BIGSERIAL PRIMARY KEY,
    id_ot BIGINT NOT NULL,
    id_producto BIGINT NOT NULL,
    cantidad_requerida INTEGER NOT NULL CHECK (cantidad_requerida > 0),
    id_existencia_asignada BIGINT,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ASIGNADO')),
    CONSTRAINT fk_ot_repuesto_ot FOREIGN KEY (id_ot) REFERENCES tmnt_ot(id_ot) ON DELETE CASCADE,
    CONSTRAINT fk_ot_repuesto_producto FOREIGN KEY (id_producto) REFERENCES tinv_producto(id_producto),
    CONSTRAINT fk_ot_repuesto_existencia FOREIGN KEY (id_existencia_asignada) REFERENCES tinv_existencia(id_existencia)
);
COMMENT ON TABLE tmnt_ot_repuesto IS 'Requerimientos de materiales y repuestos para la ejecución de la OT.';

-- 2.4 Tabla: Mano de Obra HH
CREATE TABLE tmnt_ot_hh (
    id_ot_hh BIGSERIAL PRIMARY KEY,
    id_ot BIGINT NOT NULL,
    id_tecnico BIGINT NOT NULL,
    horas_reales NUMERIC(6,2) NOT NULL CHECK (horas_reales >= 0),
    tarifa_hora NUMERIC(10,2) NOT NULL CHECK (tarifa_hora >= 0),
    descripcion_trabajo TEXT NOT NULL,
    costo_calculado NUMERIC(15,2) GENERATED ALWAYS AS (horas_reales * tarifa_hora) STORED,
    CONSTRAINT fk_ot_hh_ot FOREIGN KEY (id_ot) REFERENCES tmnt_ot(id_ot) ON DELETE CASCADE
);
COMMENT ON TABLE tmnt_ot_hh IS 'Registro de Horas Hombre imputadas a una OT.';

-- 2.5 Tabla: Servicios Externos
CREATE TABLE tmnt_ot_servicio_ext (
    id_ot_servicio_ext BIGSERIAL PRIMARY KEY,
    id_ot BIGINT NOT NULL,
    proveedor VARCHAR(150) NOT NULL,
    numero_documento_compra VARCHAR(50) NOT NULL,
    costo_neto_servicio NUMERIC(15,2) NOT NULL CHECK (costo_neto_servicio >= 0),
    CONSTRAINT fk_ot_servicio_ot FOREIGN KEY (id_ot) REFERENCES tmnt_ot(id_ot) ON DELETE CASCADE
);
COMMENT ON TABLE tmnt_ot_servicio_ext IS 'Servicios provistos por terceros para la OT.';

-- 2.6 Tabla: Cierre de OT
CREATE TABLE tmnt_ot_cierre (
    id_ot_cierre BIGSERIAL PRIMARY KEY,
    id_ot BIGINT UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    fecha_cierre TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    costo_repuestos NUMERIC(15,2) NOT NULL DEFAULT 0,
    costo_hh NUMERIC(15,2) NOT NULL DEFAULT 0,
    costo_servicios_ext NUMERIC(15,2) NOT NULL DEFAULT 0,
    costo_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_ot_cierre_ot FOREIGN KEY (id_ot) REFERENCES tmnt_ot(id_ot) ON DELETE CASCADE
);
COMMENT ON TABLE tmnt_ot_cierre IS 'Resumen consolidado y confirmación del cierre de la OT mediante firma.';

-- ==========================================================================
-- 3. ÍNDICES DE RENDIMIENTO CLAVE
-- ==========================================================================

-- Índices en WMS
CREATE INDEX idx_existencia_sku ON tinv_existencia(sku);
CREATE INDEX idx_existencia_producto ON tinv_existencia(id_producto);
CREATE INDEX idx_existencia_bodega ON tinv_existencia(id_bodega, estado);
CREATE INDEX idx_movimiento_existencia ON tinv_movimiento(id_existencia);
CREATE INDEX idx_movimiento_ot ON tinv_movimiento(id_ot);

-- Índices en Mantenimiento (OTs)
CREATE INDEX idx_ot_equipo ON tmnt_ot(id_equipo, estado);
CREATE INDEX idx_ot_estado ON tmnt_ot(estado);
CREATE INDEX idx_ot_folio ON tmnt_ot(numero_folio);
CREATE INDEX idx_ot_actividad_ot ON tmnt_ot_actividad(id_ot, estado);
CREATE INDEX idx_ot_repuesto_ot ON tmnt_ot_repuesto(id_ot, estado);

-- ==========================================================================
-- 4. TRIGGERS Y REGLAS DE NEGOCIO (FUNCTIONS)
-- ==========================================================================

-- Trigger Function: Validar que no se cierre una OT si hay actividades incompletas o repuestos pendientes
CREATE OR REPLACE FUNCTION fn_chk_cierre_ot()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado cambia a CERRADA
    IF NEW.estado = 'CERRADA' AND (OLD.estado IS NULL OR OLD.estado != 'CERRADA') THEN
        -- 1. Validar Actividades
        IF EXISTS (
            SELECT 1 FROM sch_leangsp.tmnt_ot_actividad 
            WHERE id_ot = NEW.id_ot AND estado != 'COMPLETADA'
        ) THEN
            RAISE EXCEPTION 'Regla de Negocio: No se puede cerrar la OT (ID: %) porque tiene actividades sin completar.', NEW.id_ot;
        END IF;

        -- 2. Validar Repuestos
        IF EXISTS (
            SELECT 1 FROM sch_leangsp.tmnt_ot_repuesto 
            WHERE id_ot = NEW.id_ot AND estado = 'PENDIENTE'
        ) THEN
            RAISE EXCEPTION 'Regla de Negocio: No se puede cerrar la OT (ID: %) porque tiene repuestos en estado PENDIENTE.', NEW.id_ot;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chk_cierre_ot
BEFORE UPDATE ON tmnt_ot
FOR EACH ROW
EXECUTE FUNCTION fn_chk_cierre_ot();
