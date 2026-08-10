-- =============================================================================
-- MIGRACIÓN DDL SQL: SISTEMA DE REPORTES DIARIOS, EDP, TELEMETRÍA Y COSTOS 360
-- ESQUEMA: sch_leangsp
-- FECHA: 10/08/2026
-- ESPECIFICACIÓN: .agents/specs/27_modelo_ppd_devengado_edp_spec.md
-- =============================================================================

-- 1. Logística y Desplazamiento de Flota (Con 4 Timestamps, Geolocalizaciones GPS y pings JSONB)
CREATE TABLE IF NOT EXISTS sch_leangsp.tequ_log_desplazamiento (
    id_log_desplazamiento BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    id_equipo INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    patente VARCHAR(20),
    tipo_trayecto VARCHAR(30) DEFAULT 'IDA', -- 'IDA' (Base ➔ Faena), 'RETORNO' (Faena ➔ Base)
    
    -- 4 Timestamps Logísticos
    fecha_salida_patio TIMESTAMP WITH TIME ZONE,
    fecha_llegada_faena TIMESTAMP WITH TIME ZONE,
    fecha_salida_faena TIMESTAMP WITH TIME ZONE,
    fecha_llegada_patio TIMESTAMP WITH TIME ZONE,
    
    -- Geolocalizaciones GPS del Viaje
    latitud_salida_patio NUMERIC(10, 7),
    longitud_salida_patio NUMERIC(10, 7),
    latitud_llegada_faena NUMERIC(10, 7),
    longitud_llegada_faena NUMERIC(10, 7),
    latitud_salida_faena NUMERIC(10, 7),
    longitud_salida_faena NUMERIC(10, 7),
    latitud_llegada_patio NUMERIC(10, 7),
    longitud_llegada_patio NUMERIC(10, 7),
    
    km_inicial NUMERIC(10, 2),
    km_final NUMERIC(10, 2),
    estado_trayecto VARCHAR(30) DEFAULT 'EN_RUTA', -- 'EN_RUTA', 'LLEGADO'
    pings_ruta JSONB DEFAULT '[]'::jsonb, -- Arreglo de coordenadas GPS de ruta
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Encabezado de Estado de Pago (EDP)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_estado_pago (
    id_edp BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    numero_edp VARCHAR(30) NOT NULL, -- ej. 'EDP-01'
    fecha_corte_inicio DATE NOT NULL,
    fecha_corte_fin DATE NOT NULL,
    monto_neto NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_iva NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estado_edp VARCHAR(30) DEFAULT 'BORRADOR', -- 'BORRADOR', 'APROBADO_CLIENTE', 'FACTURADO'
    -- Anexo Factura ERP Cliente
    folio_factura_erp VARCHAR(50),
    fecha_facturacion_erp DATE,
    archivo_factura_pdf_path TEXT,
    archivo_factura_xml_path TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reporte Diario de Avance (Con 2 Timestamps, Geolocalizaciones de Inicio/Término Servicio y FK id_edp)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_reporte_avance (
    id_reporte_avance BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    id_edp BIGINT REFERENCES sch_leangsp.tedp_estado_pago(id_edp) ON DELETE SET NULL, -- NULL mientras no está liquidado
    id_log_desplazamiento BIGINT REFERENCES sch_leangsp.tequ_log_desplazamiento(id_log_desplazamiento),
    id_user_operador INT NOT NULL,
    fecha_reporte DATE NOT NULL,
    unidad_cobro VARCHAR(20) NOT NULL, -- 'HRS_DIA', 'HRS_MENSUAL', 'FIJO', 'FLETE'
    incluye_flete_independiente BOOLEAN DEFAULT TRUE,
    
    -- Timestamps del Turno en Faena
    fecha_inicio_servicio TIMESTAMP WITH TIME ZONE,
    fecha_termino_servicio TIMESTAMP WITH TIME ZONE,
    
    -- Geolocalizaciones GPS del Servicio
    latitud_inicio_servicio NUMERIC(10, 7),
    longitud_inicio_servicio NUMERIC(10, 7),
    latitud_termino_servicio NUMERIC(10, 7),
    longitud_termino_servicio NUMERIC(10, 7),
    
    horas_operadas NUMERIC(5, 2) DEFAULT 0,
    horas_standby NUMERIC(5, 2) DEFAULT 0,
    horas_colacion NUMERIC(5, 2) DEFAULT 0,
    monto_devengado_dia NUMERIC(14, 2) DEFAULT 0,
    observacion_trabajo TEXT,
    
    -- Firma Manual del Cliente en Terreno (Canvas Touch)
    cliente_nombre VARCHAR(150),
    cliente_rut VARCHAR(20),
    cliente_cargo VARCHAR(100),
    cliente_firma_canvas_base64 TEXT,
    
    estado_reporte VARCHAR(30) DEFAULT 'PENDIENTE_EDP', -- 'PENDIENTE_EDP', 'AGRUPADO_EDP'
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ítems Adicionales del Estado de Pago (Líneas no provenientes de Reportes Diarios: Flete, Ajustes)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_estado_pago_detalle (
    id_edp_detalle BIGSERIAL PRIMARY KEY,
    id_edp BIGINT NOT NULL REFERENCES sch_leangsp.tedp_estado_pago(id_edp) ON DELETE CASCADE,
    concepto VARCHAR(255) NOT NULL, -- ej. 'Cobro Fijo de Flete y Movilización Grúa 100T'
    unidad_cobro VARCHAR(20) NOT NULL,
    cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0
);

-- 5. Imputación de Costos Reales del Servicio (Combustible, Viáticos)
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
