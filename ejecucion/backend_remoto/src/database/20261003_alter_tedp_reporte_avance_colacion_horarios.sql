-- =============================================================================
-- MIGRACIÓN DDL SQL: HORARIOS OPERATIVOS Y HORARIOS DE COLACIÓN EN REPORTES DIARIOS
-- ESQUEMA: sch_leangsp
-- FECHA: 03/10/2026
-- ESPECIFICACIÓN: .agents/specs/62_edp_fechas_horas_colacion_y_formato_email_spec.md
-- =============================================================================

-- 1. Agregar columnas para horarios de jornada y colación en tedp_reporte_avance
ALTER TABLE sch_leangsp.tedp_reporte_avance
  ADD COLUMN IF NOT EXISTS hora_inicio VARCHAR(10),
  ADD COLUMN IF NOT EXISTS hora_termino VARCHAR(10),
  ADD COLUMN IF NOT EXISTS hora_inicio_colacion VARCHAR(10) DEFAULT '13:00',
  ADD COLUMN IF NOT EXISTS hora_termino_colacion VARCHAR(10) DEFAULT '14:00';

-- 2. Backfill de datos históricos existentes
-- Poblar hora_inicio y hora_termino desde ajustes_analista o fecha_inicio_servicio/fecha_termino_servicio
UPDATE sch_leangsp.tedp_reporte_avance
SET 
  hora_inicio = COALESCE(
    ajustes_analista->'valores_ajustados'->>'hora_inicio',
    ajustes_analista->'valores_originales'->>'hora_inicio',
    to_char(fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI'),
    '08:00'
  ),
  hora_termino = COALESCE(
    ajustes_analista->'valores_ajustados'->>'hora_termino',
    ajustes_analista->'valores_originales'->>'hora_termino',
    to_char(fecha_termino_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI'),
    '18:00'
  )
WHERE hora_inicio IS NULL OR hora_termino IS NULL;

-- Poblar hora_inicio_colacion y hora_termino_colacion según horas_colacion
UPDATE sch_leangsp.tedp_reporte_avance
SET
  hora_inicio_colacion = CASE 
    WHEN COALESCE(horas_colacion, 1) > 0 THEN '13:00' 
    ELSE NULL 
  END,
  hora_termino_colacion = CASE 
    WHEN COALESCE(horas_colacion, 1) >= 1.0 THEN '14:00'
    WHEN COALESCE(horas_colacion, 1) >= 0.75 THEN '13:45'
    WHEN COALESCE(horas_colacion, 1) >= 0.5 THEN '13:30'
    WHEN COALESCE(horas_colacion, 1) > 0 THEN '13:30'
    ELSE NULL 
  END
WHERE hora_inicio_colacion IS NULL OR hora_termino_colacion IS NULL;

COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.hora_inicio IS 'Hora inicio de faena reportada/ajustada (HH:MM)';
COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.hora_termino IS 'Hora término de faena reportada/ajustada (HH:MM)';
COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.hora_inicio_colacion IS 'Hora inicio del período de colación en faena (HH:MM)';
COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.hora_termino_colacion IS 'Hora término del período de colación en faena (HH:MM)';
