-- =============================================================================
-- MIGRACIÓN DDL SQL: SISTEMA DE REPORTES DIARIOS, EDP, TELEMETRÍA Y COSTOS 360
-- ESQUEMA: sch_leangsp
-- FECHA: 10/08/2026
-- ESPECIFICACIÓN: .agents/specs/27_modelo_ppd_devengado_edp_spec.md
-- =============================================================================

-- 1. Log de Desplazamiento de Equipos (Pings GPS en Ruta)
CREATE TABLE IF NOT EXISTS sch_leangsp.tequ_log_desplazamiento (
    id_log BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    id_equipo INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    patente VARCHAR(20),
    latitud NUMERIC(10, 7) NOT NULL,
    longitud NUMERIC(10, 7) NOT NULL,
    velocidad_kmh NUMERIC(5, 2) DEFAULT 0,
    evento VARCHAR(50) DEFAULT 'PING_RUTA', -- 'INICIO_DESPLAZAMIENTO', 'PING_RUTA', 'LLEGADA_FAENA', 'RETORNO_BASE'
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Registro de Reportes Diarios de Avance en Terreno
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_reporte_avance (
    id_reporte_avance BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    id_user_operador INT NOT NULL,
    fecha_reporte DATE NOT NULL,
    unidad_cobro VARCHAR(20) NOT NULL, -- 'HRS_DIA', 'HRS_MENSUAL', 'FIJO', 'FLETE'
    horas_operadas NUMERIC(5, 2) DEFAULT 0,
    horas_standby NUMERIC(5, 2) DEFAULT 0,
    horas_colacion NUMERIC(5, 2) DEFAULT 0,
    monto_devengado_dia NUMERIC(14, 2) DEFAULT 0,
    observacion_trabajo TEXT,
    -- Firma Manual del Cliente en Terreno
    cliente_nombre VARCHAR(150),
    cliente_rut VARCHAR(20),
    cliente_cargo VARCHAR(100),
    cliente_firma_canvas_base64 TEXT, -- Firma manuscrita en pantalla touch
    estado_reporte VARCHAR(30) DEFAULT 'PENDIENTE_EDP', -- 'PENDIENTE_EDP', 'LIQUIDADO_EDP'
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Encabezado de Estados de Pago (EDP)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_estado_pago (
    id_edp BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    numero_edp VARCHAR(30) NOT NULL, -- ej. 'EDP-01', 'EDP-02'
    fecha_corte_inicio DATE NOT NULL,
    fecha_corte_fin DATE NOT NULL,
    monto_neto NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_iva NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estado_edp VARCHAR(30) DEFAULT 'BORRADOR', -- 'BORRADOR', 'APROBADO_CLIENTE', 'FACTURADO'
    -- Anexo de Factura emitida en ERP del cliente
    folio_factura_erp VARCHAR(50),
    fecha_facturacion_erp DATE,
    archivo_factura_pdf_path TEXT,
    archivo_factura_xml_path TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Detalle y Líneas Consolidadas del Estado de Pago
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_estado_pago_detalle (
    id_edp_detalle BIGSERIAL PRIMARY KEY,
    id_edp BIGINT NOT NULL REFERENCES sch_leangsp.tedp_estado_pago(id_edp) ON DELETE CASCADE,
    id_reporte_avance BIGINT REFERENCES sch_leangsp.tedp_reporte_avance(id_reporte_avance),
    concepto VARCHAR(255) NOT NULL,
    unidad_cobro VARCHAR(20) NOT NULL,
    cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0
);

-- 5. Imputación de Costos Reales del Servicio (Asociados al EDP / OT)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_costos_servicio (
    id_costo BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    id_edp BIGINT REFERENCES sch_leangsp.tedp_estado_pago(id_edp),
    categoria_costo VARCHAR(50) NOT NULL, -- 'COMBUSTIBLE', 'VIATICOS', 'PEAJES', 'ALOJAMIENTO', 'ESCOLTA', 'OTROS'
    monto_costo NUMERIC(14, 2) NOT NULL DEFAULT 0,
    litros_combustible NUMERIC(8, 2),
    kilometraje_odometro NUMERIC(10, 2),
    numero_comprobante VARCHAR(50),
    archivo_comprobante_path TEXT,
    observacion TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
