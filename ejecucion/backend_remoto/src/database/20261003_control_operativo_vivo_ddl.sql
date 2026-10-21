-- =============================================================================
-- MIGRACIÓN DDL SQL: CONTROL OPERATIVO EN VIVO Y CANDADO OPERACIONAL (REQ-042 / SPEC 63)
-- ESQUEMA: sch_leangsp
-- FECHA: 03/10/2026
-- =============================================================================

-- 1. Ampliar tedp_reporte_avance con timestamps de auditoría real (transmisión M2 y dispositivo)
ALTER TABLE sch_leangsp.tedp_reporte_avance
  ADD COLUMN IF NOT EXISTS fecha_transmision_termino TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS device_timestamp TIMESTAMP WITH TIME ZONE;

-- 2. Ampliar tequ_log_desplazamiento con timestamps de captura del dispositivo en terreno
ALTER TABLE sch_leangsp.tequ_log_desplazamiento
  ADD COLUMN IF NOT EXISTS device_timestamp_salida TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS device_timestamp_llegada TIMESTAMP WITH TIME ZONE;

-- 3. Tabla de notificaciones in-web para Torre de Control
CREATE TABLE IF NOT EXISTS sch_leangsp.tnot_notification_web (
    id_notificacion SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES sch_leangsp.tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    codigo_ot VARCHAR(50),
    evento_tipo VARCHAR(50) NOT NULL, -- 'VENCIDO', 'POR_VENCER', 'TARDE', 'SIN_PLAN', 'CANDADO'
    hito_clave VARCHAR(50),           -- 'INSPECCION_PATIO', 'SALIDA_BASE', 'LLEGADA_FAENA', 'REPORT_INICIO', 'REPORT_TERMINO'
    fecha_operativa DATE NOT NULL,
    mensaje TEXT NOT NULL,
    severidad VARCHAR(20) NOT NULL,   -- 'ALTA', 'MEDIA', 'BAJA'
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    leido_por JSONB DEFAULT '[]'::jsonb
);

-- Índices de consulta rápida por fecha y proyecto
CREATE INDEX IF NOT EXISTS idx_notif_web_fecha ON sch_leangsp.tnot_notification_web(fecha_operativa);
CREATE INDEX IF NOT EXISTS idx_notif_web_ot ON sch_leangsp.tnot_notification_web(id_proyecto);
