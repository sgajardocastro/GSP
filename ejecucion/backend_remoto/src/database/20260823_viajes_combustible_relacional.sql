-- =============================================================================
-- MIGRACIÓN DDL SQL: VIAJES DE CONVOY Y COMBUSTIBLE RELACIONAL
-- ESQUEMA: sch_leangsp
-- FECHA: 23/08/2026
-- =============================================================================

-- 1. Ampliar tequ_log_desplazamiento para soportar chofer, horómetros, token de acceso y fotos
ALTER TABLE sch_leangsp.tequ_log_desplazamiento 
  ADD COLUMN IF NOT EXISTS id_user_chofer INT REFERENCES sch_leangsp.tsec_users(id_user),
  ADD COLUMN IF NOT EXISTS horometro_inicial NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS horometro_final NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS token_viaje VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(128),
  ADD COLUMN IF NOT EXISTS foto_tablero_salida_path TEXT,
  ADD COLUMN IF NOT EXISTS foto_tablero_llegada_path TEXT,
  ADD COLUMN IF NOT EXISTS obs_termino TEXT;

-- 2. Ampliar tedp_costos_servicio para vincular cargas de combustible al viaje
ALTER TABLE sch_leangsp.tedp_costos_servicio 
  ADD COLUMN IF NOT EXISTS id_log_desplazamiento BIGINT REFERENCES sch_leangsp.tequ_log_desplazamiento(id_log_desplazamiento) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_estanque VARCHAR(50),
  ADD COLUMN IF NOT EXISTS id_autorizacion_copec VARCHAR(50),
  ADD COLUMN IF NOT EXISTS estado_autorizacion VARCHAR(30) DEFAULT 'APROBADO',
  ADD COLUMN IF NOT EXISTS horometro_odometro NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS foto_tablero_path TEXT;
