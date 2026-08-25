-- =============================================================================
-- MIGRACIÓN DDL SQL: AMPLIACIÓN DE REPORTE DIARIO DE AVANCE (FAENA / IZAJE)
-- ESQUEMA: sch_leangsp
-- FECHA: 25/08/2026
-- ESPECIFICACIÓN: .agents/specs/34_report_diario_izaje_firma_manual_spec.md
-- =============================================================================

-- 1. Extender sch_leangsp.tedp_reporte_avance con campos operativos de terreno
ALTER TABLE sch_leangsp.tedp_reporte_avance 
  ADD COLUMN IF NOT EXISTS id_equipo          INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
  ADD COLUMN IF NOT EXISTS id_user_rigger     INT REFERENCES sch_leangsp.tsec_users(id_user),
  ADD COLUMN IF NOT EXISTS dia_correlativo    INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS horometro_inicio   NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS horometro_termino  NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS foto_horometro     TEXT,
  ADD COLUMN IF NOT EXISTS horas_minimas      NUMERIC(5, 2) DEFAULT 4.00,
  ADD COLUMN IF NOT EXISTS horas_facturables  NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_sobretiempo  NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_report       VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS accuracy_firma     NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS id_user_validador  INT REFERENCES sch_leangsp.tsec_users(id_user),
  ADD COLUMN IF NOT EXISTS fecha_validacion   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS obs_validador      TEXT;

-- 2. Índices de rendimiento para consultas en Torre de Control y PWA
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_proy ON sch_leangsp.tedp_reporte_avance(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_eq   ON sch_leangsp.tedp_reporte_avance(id_equipo);
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_fec  ON sch_leangsp.tedp_reporte_avance(id_proyecto, fecha_reporte);
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_tok  ON sch_leangsp.tedp_reporte_avance(token_report);

COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.dia_correlativo IS 'Número de día secuencial del servicio en faena (Día 1, Día 2, etc.)';
COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.cliente_firma_canvas_base64 IS 'Firma manuscrita del receptor mandante capturada en Canvas táctil (PNG Base64)';
COMMENT ON COLUMN sch_leangsp.tedp_reporte_avance.estado_reporte IS 'Estado del report: PENDIENTE_VALIDACION, VALIDADO_ANALISTA, OBSERVADO, AGRUPADO_EDP';
