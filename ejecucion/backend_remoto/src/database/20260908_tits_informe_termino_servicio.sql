-- =============================================================================
-- MIGRACIÓN DDL SQL: INFORME DE TÉRMINO DE SERVICIO (ITS) Y COSTOS OPERACIONALES
-- ESQUEMA: sch_leangsp
-- FECHA: 08/09/2026
-- ESPECIFICACIÓN: .agents/specs/46_informe_termino_servicio_its_spec.md
-- =============================================================================

-- 1. Cabecera del Informe de Término de Servicio (ITS)
CREATE TABLE IF NOT EXISTS sch_leangsp.tits_informe_termino (
    id_its BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto) ON DELETE RESTRICT,
    folio_its VARCHAR(50) NOT NULL UNIQUE, -- ej: 'ITS-2608-001'
    version INT NOT NULL DEFAULT 1,
    tipo_contexto VARCHAR(20) NOT NULL CHECK (tipo_contexto IN ('URBANO', 'RURAL')),
    
    -- Tarifas comerciales pactadas de liquidación
    horas_minimas_pactadas NUMERIC(6, 2) NOT NULL DEFAULT 8.00,
    valor_hora_pactado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    valor_flete_pactado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    -- Balance Económico Consolidado (Auditoría Financiera)
    total_horas_report NUMERIC(8, 2) NOT NULL DEFAULT 0,
    total_ingresos_horas NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_ingresos_fletes NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_ingresos_facturables NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_costos_operacionales NUMERIC(14, 2) NOT NULL DEFAULT 0,
    utilidad_bruta NUMERIC(14, 2) NOT NULL DEFAULT 0,
    margen_porcentaje NUMERIC(6, 2) NOT NULL DEFAULT 0,
    
    -- Observaciones y Plantilla
    plantilla_tipo VARCHAR(20) DEFAULT 'URBANO' CHECK (plantilla_tipo IN ('URBANO', 'RURAL', 'PERSONALIZADA')),
    observaciones TEXT,
    
    -- Máquina de Estados & Triple Firma Interna
    estado_its VARCHAR(30) NOT NULL DEFAULT 'BORRADOR' 
        CHECK (estado_its IN ('BORRADOR', 'ELABORADO', 'APROBADO_OPERACIONES', 'RECIBIDO_CONTABILIDAD')),
    
    id_user_elaborado INT REFERENCES sch_leangsp.tsec_users(id_user),
    fecha_elaborado TIMESTAMP WITH TIME ZONE,
    
    id_user_aprobado INT REFERENCES sch_leangsp.tsec_users(id_user),
    fecha_aprobado TIMESTAMP WITH TIME ZONE,
    
    id_user_recibido INT REFERENCES sch_leangsp.tsec_users(id_user),
    fecha_recibido TIMESTAMP WITH TIME ZONE,
    
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tits_informe_proy ON sch_leangsp.tits_informe_termino(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tits_informe_folio ON sch_leangsp.tits_informe_termino(folio_its);
CREATE INDEX IF NOT EXISTS idx_tits_informe_estado ON sch_leangsp.tits_informe_termino(estado_its);

-- 2. Detalle de Control de Flota y Validación de Jornadas
CREATE TABLE IF NOT EXISTS sch_leangsp.tits_jornada_detalle (
    id_jornada BIGSERIAL PRIMARY KEY,
    id_its BIGINT NOT NULL REFERENCES sch_leangsp.tits_informe_termino(id_its) ON DELETE CASCADE,
    id_reporte_avance BIGINT REFERENCES sch_leangsp.tedp_reporte_avance(id_reporte_avance) ON DELETE SET NULL,
    
    fecha DATE NOT NULL,
    numero_ot VARCHAR(50) NOT NULL,
    id_equipo INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    patente VARCHAR(20) NOT NULL,
    
    tipo_servicio VARCHAR(30) NOT NULL CHECK (
        tipo_servicio IN ('Hora', 'Mensual', 'Fijo', 'Flete Ida y Retorno', 'Flete Solo Ida', 'Flete Solo Retorno', 'Visita Terreno', 'Interno')
    ),
    
    hora_salida TIME,
    hora_llegada TIME,
    hora_termino TIME,
    hora_retorno TIME,
    colacion_minutos INT NOT NULL DEFAULT 60,
    
    horas_reales NUMERIC(5, 2) NOT NULL DEFAULT 0,
    horas_report NUMERIC(5, 2) NOT NULL DEFAULT 0, -- Horas facturables aprobadas
    numero_report VARCHAR(50),                     -- Token digital o correlativo físico
    
    es_oculta BOOLEAN NOT NULL DEFAULT FALSE,       -- TRUE si se tachó/excluyó del cobro
    vb_conciliado BOOLEAN NOT NULL DEFAULT FALSE,
    orden INT NOT NULL DEFAULT 0,
    
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tits_jornada_its ON sch_leangsp.tits_jornada_detalle(id_its);
CREATE INDEX IF NOT EXISTS idx_tits_jornada_rep ON sch_leangsp.tits_jornada_detalle(id_reporte_avance);
CREATE INDEX IF NOT EXISTS idx_tits_jornada_fec ON sch_leangsp.tits_jornada_detalle(fecha, patente);

-- 3. Planilla de Costos Operacionales Directos (8 Categorías de Terreno)
CREATE TABLE IF NOT EXISTS sch_leangsp.tits_costo_operacional (
    id_costo_item BIGSERIAL PRIMARY KEY,
    id_its BIGINT NOT NULL REFERENCES sch_leangsp.tits_informe_termino(id_its) ON DELETE CASCADE,
    
    categoria VARCHAR(30) NOT NULL CHECK (
        categoria IN (
            'ALIMENTACION', 
            'PEAJES', 
            'PENSIONES', 
            'PERSONAL_EXTERNO', 
            'FERIADOS', 
            'SUBCONTRATO_FLETE', 
            'GASTOS_EXTRA', 
            'COSTO_HORA_OPERADOR'
        )
    ),
    
    fecha DATE NOT NULL,
    id_personal INT REFERENCES sch_leangsp.tsec_users(id_user),
    nombre_personal VARCHAR(150),
    id_equipo INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    patente VARCHAR(20),
    
    -- Trazabilidad Contable y Respaldo OC
    numero_oc VARCHAR(50),
    concepto_detalle TEXT NOT NULL,
    
    -- Tipo de liquidación y montos
    tipo_calculo VARCHAR(20) DEFAULT 'MONTO_DIRECTO' CHECK (tipo_calculo IN ('MONTO_DIRECTO', 'HORA_OPERADOR', 'DESGLOSE_PENSION')),
    cantidad_unidades NUMERIC(8, 2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    -- Desglose Específico para Categoría PENSIONES
    monto_desayuno NUMERIC(12, 2) DEFAULT 0,
    monto_almuerzo NUMERIC(12, 2) DEFAULT 0,
    monto_cena NUMERIC(12, 2) DEFAULT 0,
    monto_alojamiento NUMERIC(12, 2) DEFAULT 0,
    monto_traslado NUMERIC(12, 2) DEFAULT 0,
    
    -- Respaldo de Comprobante / Voucher
    id_archivo_comprobante INT REFERENCES sch_leangsp.tfmg_archivo(id_archivo),
    
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tits_costo_its ON sch_leangsp.tits_costo_operacional(id_its);
CREATE INDEX IF NOT EXISTS idx_tits_costo_cat ON sch_leangsp.tits_costo_operacional(id_its, categoria);
CREATE INDEX IF NOT EXISTS idx_tits_costo_fecha ON sch_leangsp.tits_costo_operacional(fecha);
CREATE INDEX IF NOT EXISTS idx_tits_costo_oc ON sch_leangsp.tits_costo_operacional(numero_oc);
