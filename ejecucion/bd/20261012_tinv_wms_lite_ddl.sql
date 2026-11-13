-- ============================================================================
-- SCRIPT DDL: MÓDULO INVENTARIO WMS-LITE (CANÓNICO V3.0)
-- Proyecto: Grúas San Pablo (GSP) / LeanGlobal Platform
-- Esquemas objetivo: sch_leangsp (DEV) / sch_leangsp_prod (PROD)
-- Especificación de referencia: Spec 48 (V3.0)
-- Fecha de generación: 2026-10-12
-- ============================================================================

-- Configuración de search_path (ajustar según ambiente: sch_leangsp o sch_leangsp_prod)
SET search_path TO sch_leangsp, public;

-- ----------------------------------------------------------------------------
-- 1. SECUENCIAS
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS sch_leangsp.seq_tinv_producto_sku START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sch_leangsp.seq_tinv_recepcion_folio START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sch_leangsp.seq_tinv_traspaso_folio START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sch_leangsp.seq_tinv_conteo_folio START WITH 1 INCREMENT BY 1;

-- ----------------------------------------------------------------------------
-- 2. TABLA: tinv_bodega (Instalaciones físicas de almacenamiento)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_bodega (
    id_bodega BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_sucursal BIGINT NOT NULL DEFAULT 1,
    nombre VARCHAR(100) NOT NULL,
    tipo_bodega VARCHAR(30) NOT NULL DEFAULT 'TALLER_CENTRAL' 
        CHECK (tipo_bodega IN ('TALLER_CENTRAL', 'FAENA', 'MOVIL_CAMION', 'EXTERNA')),
    consolida_stock BOOLEAN NOT NULL DEFAULT true,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_bodega_empresa_nombre UNIQUE (id_empresa, nombre)
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: tinv_ubicacion (Maestro Jerárquico de Posiciones / Bins)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_ubicacion (
    id_ubicacion BIGSERIAL PRIMARY KEY,
    id_bodega BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    codigo VARCHAR(30) NOT NULL, -- 'E4-F2', 'CORRAL', 'PAÑOL', 'CUARENTENA', 'SIN-UBICAR'
    estanteria VARCHAR(10),       -- 'E1', 'E2' ... 'E9'
    nivel VARCHAR(5),             -- 'A', 'B' ... 'G'
    posicion VARCHAR(5),          -- '1', '2' ... '6'
    tipo_zona VARCHAR(30) NOT NULL DEFAULT 'RACK'
        CHECK (tipo_zona IN ('RACK', 'PISO_VOLUMEN', 'PAÑOL_HERRAMIENTAS', 'CORRAL_PATIO', 'RECEPCION', 'CUARENTENA', 'TRANSITO', 'VIRTUAL')),
    permite_mezcla_sku BOOLEAN NOT NULL DEFAULT true,
    estado VARCHAR(20) NOT NULL DEFAULT 'OPERATIVA' CHECK (estado IN ('OPERATIVA', 'BLOQUEADA', 'MANTENCION')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_ubicacion_bodega_codigo UNIQUE (id_bodega, codigo)
);

CREATE INDEX IF NOT EXISTS idx_tinv_ubicacion_coords 
ON sch_leangsp.tinv_ubicacion(id_bodega, estanteria, nivel, posicion);

-- ----------------------------------------------------------------------------
-- 4. TABLA: tinv_producto (Catálogo Maestro Desacoplado con SKU Mudo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_producto (
    id_producto BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    sku VARCHAR(30) NOT NULL,            -- Correlativo inmutable: 'GSP-000158'
    codigo_legado VARCHAR(50),           -- Código histórico migrado: 'FCM0005', 'TMR0058'
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    familia VARCHAR(50) NOT NULL,        -- 'Filtros', 'Aceites y Lubricantes', etc.
    subfamilia VARCHAR(50),
    unidad_medida_base VARCHAR(20) NOT NULL DEFAULT 'UN', -- 'UN', 'L', 'm', 'kg', 'PAR'
    presentacion_compra VARCHAR(20),     -- 'TAMBOR', 'ROLLO', 'BALDE', 'CAJA'
    factor_conversion NUMERIC(12,4) DEFAULT 1.0000,       -- Ej: 1 TAMBOR = 208 L
    tipo_control VARCHAR(20) NOT NULL DEFAULT 'NINGUNO' 
        CHECK (tipo_control IN ('NINGUNO', 'LOTE', 'SERIE')),
    es_rotable BOOLEAN NOT NULL DEFAULT false,
    impacto_operacional VARCHAR(15) NOT NULL DEFAULT 'NORMAL' 
        CHECK (impacto_operacional IN ('CRITICO', 'IMPORTANTE', 'NORMAL')),
    lead_time VARCHAR(10) NOT NULL DEFAULT 'CORTO' 
        CHECK (lead_time IN ('LARGO', 'MEDIO', 'CORTO')),
    clase_abc VARCHAR(2) NOT NULL DEFAULT 'C' CHECK (clase_abc IN ('A', 'B', 'C')),
    stock_minimo NUMERIC(14,4) NOT NULL DEFAULT 1 CHECK (stock_minimo >= 0),
    stock_maximo NUMERIC(14,4) NOT NULL DEFAULT 5 CHECK (stock_maximo >= stock_minimo),
    punto_reorden NUMERIC(14,4) NOT NULL DEFAULT 2 CHECK (punto_reorden >= stock_minimo),
    costo_pmp_vigente NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    requiere_revalorizacion BOOLEAN NOT NULL DEFAULT false, -- True para ítems legados con precio <= $1
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_producto_empresa_sku UNIQUE (id_empresa, sku)
);

CREATE INDEX IF NOT EXISTS idx_tinv_producto_busqueda 
ON sch_leangsp.tinv_producto(id_empresa, familia, impacto_operacional, estado);

CREATE INDEX IF NOT EXISTS idx_tinv_producto_legado 
ON sch_leangsp.tinv_producto(id_empresa, codigo_legado);

-- ----------------------------------------------------------------------------
-- 5. TABLA: tinv_producto_referencia (Equivalencias OEM vs Alternativos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_producto_referencia (
    id_referencia BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto) ON DELETE CASCADE,
    tipo_referencia VARCHAR(20) NOT NULL CHECK (tipo_referencia IN ('OEM', 'ALTERNATIVO', 'PROVEEDOR_LOCAL')),
    marca VARCHAR(100) NOT NULL,          -- 'Donaldson', 'Fleetguard', 'MANN', 'Parker'
    codigo_referencia VARCHAR(100) NOT NULL, -- 'P553004', 'FF42000', 'W712'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_prod_ref UNIQUE (id_producto, tipo_referencia, codigo_referencia)
);

CREATE INDEX IF NOT EXISTS idx_tinv_ref_codigo 
ON sch_leangsp.tinv_producto_referencia(codigo_referencia);

-- ----------------------------------------------------------------------------
-- 6. TABLA: tinv_producto_compatibilidad (Compatibilidad con Flota tequ_equipo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_producto_compatibilidad (
    id_compatibilidad BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto) ON DELETE CASCADE,
    modelo_equipo VARCHAR(100) NOT NULL, -- 'Liebherr LTM 1100-4.2', 'Grove GMK 5250L', 'Flota Completa'
    notas VARCHAR(255),
    CONSTRAINT uq_tinv_prod_compat UNIQUE (id_producto, modelo_equipo)
);

-- ----------------------------------------------------------------------------
-- 7. TABLAS: tinv_lote y tinv_serie (Trazabilidad Condicional)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_lote (
    id_lote BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    numero_lote VARCHAR(50) NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE,
    fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_lote_producto UNIQUE (id_producto, numero_lote)
);

CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_serie (
    id_serie BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    numero_serie VARCHAR(100) NOT NULL,
    estado_rotable VARCHAR(30) NOT NULL DEFAULT 'NUEVO_DISPONIBLE'
        CHECK (estado_rotable IN ('NUEVO_DISPONIBLE', 'USADO_OPERATIVO', 'INSTALADO_EN_EQUIPO', 'EN_REPARACION_EXTERNA', 'DE_BAJA')),
    id_equipo_instalado BIGINT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    horometro_instalacion NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_serie_producto UNIQUE (id_producto, numero_serie)
);

-- ----------------------------------------------------------------------------
-- 8. TABLA: tinv_stock (Quants: Saldo Físico por Posición)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_stock (
    id_stock BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    id_ubicacion BIGINT NOT NULL REFERENCES sch_leangsp.tinv_ubicacion(id_ubicacion),
    id_lote BIGINT REFERENCES sch_leangsp.tinv_lote(id_lote),
    id_serie BIGINT REFERENCES sch_leangsp.tinv_serie(id_serie),
    estado_stock VARCHAR(20) NOT NULL DEFAULT 'LIBRE'
        CHECK (estado_stock IN ('LIBRE', 'CALIDAD_CUARENTENA', 'EN_REPARACION', 'EN_TRANSITO')),
    cantidad_fisica NUMERIC(14,4) NOT NULL DEFAULT 0.0000 CHECK (cantidad_fisica >= 0),
    cantidad_reservada NUMERIC(14,4) NOT NULL DEFAULT 0.0000 CHECK (cantidad_reservada >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tinv_stock_quant 
ON sch_leangsp.tinv_stock(
    id_empresa, id_producto, id_ubicacion, 
    COALESCE(id_lote, 0), COALESCE(id_serie, 0), estado_stock
);

-- ----------------------------------------------------------------------------
-- 9. TABLA: tinv_movimiento (Ledger Kardex Inmutable Append-Only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_movimiento (
    id_movimiento BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        'RECEPCION_COMPRA', 'CARGA_INICIAL', 'SALIDA_OT', 'DEVOLUCION_OT', 
        'TRASPASO_SALIDA', 'TRASPASO_ENTRADA', 'AJUSTE_CONTEO', 'BAJA_OBSOLESCENCIA', 'REVERSO'
    )),
    documento_tipo VARCHAR(30) NOT NULL, -- 'OC', 'ACTA_CONTEO', 'OT_MNT', 'GUIA_TRASPASO', 'REVERSO'
    documento_folio VARCHAR(100) NOT NULL,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    id_ubicacion BIGINT NOT NULL REFERENCES sch_leangsp.tinv_ubicacion(id_ubicacion),
    id_lote BIGINT REFERENCES sch_leangsp.tinv_lote(id_lote),
    id_serie BIGINT REFERENCES sch_leangsp.tinv_serie(id_serie),
    cantidad NUMERIC(14,4) NOT NULL,     -- Positivo (entrada), Negativo (salida)
    costo_unitario_pmp NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    costo_total NUMERIC(15,2) GENERATED ALWAYS AS (ROUND(ABS(cantidad) * costo_unitario_pmp, 2)) STORED,
    stock_anterior NUMERIC(14,4) NOT NULL,
    stock_posterior NUMERIC(14,4) NOT NULL,
    id_usuario BIGINT NOT NULL,
    id_movimiento_reversado BIGINT REFERENCES sch_leangsp.tinv_movimiento(id_movimiento),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tinv_mov_auditoria 
ON sch_leangsp.tinv_movimiento(id_empresa, id_producto, fecha_movimiento DESC);

-- Trigger de Inmutabilidad Absoluta sobre tinv_movimiento (Regla Cero Manipulación Kardex)
CREATE OR REPLACE FUNCTION sch_leangsp.fn_tinv_movimiento_inmutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACION_INTEGRIDAD: Queda estrictamente prohibido modificar o eliminar asientos del Kardex físico (tinv_movimiento). Utilice una operación de REVERSO autorizada.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tinv_movimiento_no_mutar ON sch_leangsp.tinv_movimiento;
CREATE TRIGGER trg_tinv_movimiento_no_mutar
BEFORE UPDATE OR DELETE ON sch_leangsp.tinv_movimiento
FOR EACH ROW EXECUTE FUNCTION sch_leangsp.fn_tinv_movimiento_inmutable();

-- ----------------------------------------------------------------------------
-- 10. TABLAS: tinv_recepcion y tinv_recepcion_linea
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_recepcion (
    id_recepcion BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    numero_folio VARCHAR(50) NOT NULL, -- 'REC-2610-0012'
    tipo_ingreso VARCHAR(30) NOT NULL CHECK (tipo_ingreso IN ('COMPRA', 'CARGA_INICIAL', 'DEVOLUCION_OT', 'GARANTIA', 'REPARACION_ROTABLE')),
    proveedor_o_origen VARCHAR(150) NOT NULL,
    documento_referencia VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'CONFIRMADA', 'ANULADA')),
    id_usuario_recepcion BIGINT NOT NULL,
    id_usuario_aprobacion BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_rec_folio UNIQUE (id_empresa, numero_folio)
);

CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_recepcion_linea (
    id_linea BIGSERIAL PRIMARY KEY,
    id_recepcion BIGINT NOT NULL REFERENCES sch_leangsp.tinv_recepcion(id_recepcion) ON DELETE CASCADE,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    cantidad_recibida NUMERIC(14,4) NOT NULL CHECK (cantidad_recibida > 0),
    unidad_presentacion VARCHAR(20) NOT NULL,
    factor_conversion NUMERIC(12,4) NOT NULL DEFAULT 1.0000,
    cantidad_base NUMERIC(14,4) GENERATED ALWAYS AS (cantidad_recibida * factor_conversion) STORED,
    costo_unitario_moneda NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    costo_unitario_base NUMERIC(15,2) GENERATED ALWAYS AS (ROUND(costo_unitario_moneda / factor_conversion, 2)) STORED,
    id_ubicacion_destino BIGINT NOT NULL REFERENCES sch_leangsp.tinv_ubicacion(id_ubicacion),
    lote_texto VARCHAR(50),
    serie_texto VARCHAR(100)
);

-- ----------------------------------------------------------------------------
-- 11. TABLAS: tinv_traspaso y tinv_traspaso_linea
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_traspaso (
    id_traspaso BIGSERIAL PRIMARY KEY,
    id_empresa_origen BIGINT NOT NULL,
    id_bodega_origen BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    id_empresa_destino BIGINT NOT NULL,
    id_bodega_destino BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    numero_folio VARCHAR(50) NOT NULL, -- 'TRP-0007'
    es_interempresa BOOLEAN NOT NULL DEFAULT false,
    estado VARCHAR(20) NOT NULL DEFAULT 'CREADO' CHECK (estado IN ('CREADO', 'EN_TRANSITO', 'RECIBIDO', 'CANCELADO')),
    observaciones TEXT,
    id_usuario_despacho BIGINT NOT NULL,
    id_usuario_recepcion BIGINT,
    fecha_despacho TIMESTAMPTZ,
    fecha_recepcion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_traspaso_folio UNIQUE (id_empresa_origen, numero_folio)
);

CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_traspaso_linea (
    id_traspaso_linea BIGSERIAL PRIMARY KEY,
    id_traspaso BIGINT NOT NULL REFERENCES sch_leangsp.tinv_traspaso(id_traspaso) ON DELETE CASCADE,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    id_ubicacion_origen BIGINT NOT NULL REFERENCES sch_leangsp.tinv_ubicacion(id_ubicacion),
    id_ubicacion_destino BIGINT REFERENCES sch_leangsp.tinv_ubicacion(id_ubicacion),
    cantidad NUMERIC(14,4) NOT NULL CHECK (cantidad > 0),
    costo_unitario_pmp NUMERIC(15,2) NOT NULL DEFAULT 0.00
);

-- ----------------------------------------------------------------------------
-- 12. TABLAS: tinv_conteo y tinv_conteo_linea (Procesos de Inventario & Carga)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_conteo (
    id_conteo BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_bodega BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
    codigo_proceso VARCHAR(50) NOT NULL, -- 'INV-2026-001'
    descripcion VARCHAR(255) NOT NULL,
    tipo_conteo VARCHAR(30) NOT NULL CHECK (tipo_conteo IN ('APERTURA_CARGA_INICIAL', 'CICLICO_ABC', 'GENERAL_ANUAL')),
    es_ciego BOOLEAN NOT NULL DEFAULT true,
    estado VARCHAR(25) NOT NULL DEFAULT 'PLANIFICADO' 
        CHECK (estado IN ('PLANIFICADO', 'EN_CONTEO', 'EN_RECONTEO', 'PENDIENTE_APROBACION', 'APROBADO_CONCILIADO', 'CANCELADO')),
    fecha_corte TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_supervisor_aprobador BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_conteo_codigo UNIQUE (id_empresa, codigo_proceso)
);

CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_conteo_linea (
    id_conteo_linea BIGSERIAL PRIMARY KEY,
    id_conteo BIGINT NOT NULL REFERENCES sch_leangsp.tinv_conteo(id_conteo) ON DELETE CASCADE,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
    id_ubicacion BIGINT NOT NULL REFERENCES sch_leangsp.tinv_ubicacion(id_ubicacion),
    stock_sistema_congelado NUMERIC(14,4) NOT NULL DEFAULT 0.0000,
    conteo_1 NUMERIC(14,4),
    conteo_recuento NUMERIC(14,4),
    conteo_final NUMERIC(14,4) GENERATED ALWAYS AS (COALESCE(conteo_recuento, conteo_1)) STORED,
    diferencia NUMERIC(14,4) GENERATED ALWAYS AS (COALESCE(conteo_recuento, conteo_1) - stock_sistema_congelado) STORED,
    costo_pmp_congelado NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_diferencia NUMERIC(15,2) GENERATED ALWAYS AS (ROUND((COALESCE(conteo_recuento, conteo_1) - stock_sistema_congelado) * costo_pmp_congelado, 2)) STORED,
    estado_linea VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' 
        CHECK (estado_linea IN ('PENDIENTE', 'CONCILIADA_OK', 'DIFERENCIA', 'SOBRANTE', 'RECONTAR', 'AJUSTADA'))
);

-- ============================================================================
-- FIN DDL MÓDULO INVENTARIO WMS-LITE
-- ============================================================================
