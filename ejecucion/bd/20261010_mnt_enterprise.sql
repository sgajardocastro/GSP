-- =============================================================================
-- MIGRACIÓN DDL IDEMPOTENTE: MANTENIMIENTO ENTERPRISE (SPEC 67)
-- Esquema: sch_leangsp
-- Fecha: 2026-10-10
-- =============================================================================

SET search_path TO sch_leangsp, public;

-- 1. ALTER tmnt_ot
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS prioridad SMALLINT NOT NULL DEFAULT 3;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS equipo_detenido BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS fecha_hora_detencion TIMESTAMPTZ NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS fecha_hora_liberacion TIMESTAMPTZ NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS sistema_falla VARCHAR(3) NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS modo_falla VARCHAR(25) NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS causa_falla VARCHAR(25) NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS codigo_pauta VARCHAR(10) NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS id_aviso_origen BIGINT NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS id_hallazgo_origen BIGINT NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT NULL;
ALTER TABLE sch_leangsp.tmnt_ot ADD COLUMN IF NOT EXISTS id_user_creador BIGINT NULL;
ALTER TABLE sch_leangsp.tequ_equipo ALTER COLUMN estado TYPE VARCHAR(30);

-- Ajustar constraint de estado en tmnt_ot para soportar 'ANULADA'
DO $$
BEGIN
    ALTER TABLE sch_leangsp.tmnt_ot DROP CONSTRAINT IF EXISTS tmnt_ot_estado_check;
    ALTER TABLE sch_leangsp.tmnt_ot ADD CONSTRAINT tmnt_ot_estado_check 
        CHECK (estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS', 'CERRADA', 'ANULADA'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. ALTER tmnt_ot_cierre
ALTER TABLE sch_leangsp.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS id_user_cierre BIGINT NULL;
ALTER TABLE sch_leangsp.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS diagnostico_final TEXT NULL;
ALTER TABLE sch_leangsp.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS estado_equipo_resultante VARCHAR(30) DEFAULT 'OPERATIVO';
ALTER TABLE sch_leangsp.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS restriccion_texto TEXT NULL;
ALTER TABLE sch_leangsp.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS requiere_recertificacion BOOLEAN DEFAULT false;
ALTER TABLE sch_leangsp.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS checklist_liberacion JSONB NULL;
ALTER TABLE sch_leangsp.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS id_survey_post BIGINT NULL;

-- 3. ALTER tmnt_ot_repuesto
ALTER TABLE sch_leangsp.tmnt_ot_repuesto ADD COLUMN IF NOT EXISTS id_user_registro BIGINT NULL;
ALTER TABLE sch_leangsp.tmnt_ot_repuesto ADD COLUMN IF NOT EXISTS pendiente_valorizar BOOLEAN DEFAULT false;
ALTER TABLE sch_leangsp.tmnt_ot_repuesto ADD COLUMN IF NOT EXISTS client_uuid VARCHAR(50) NULL;
-- Asegurar que id_producto sea nullable para Fase 1 manual
ALTER TABLE sch_leangsp.tmnt_ot_repuesto ALTER COLUMN id_producto DROP NOT NULL;

-- 4. ALTER tmnt_ot_hh
ALTER TABLE sch_leangsp.tmnt_ot_hh ADD COLUMN IF NOT EXISTS id_tecnico BIGINT NULL;
ALTER TABLE sch_leangsp.tmnt_ot_hh ADD COLUMN IF NOT EXISTS client_uuid VARCHAR(50) NULL;

-- 5. ALTER tmnt_ot_actividad
ALTER TABLE sch_leangsp.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS id_user_completa BIGINT NULL;
ALTER TABLE sch_leangsp.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS foto_url TEXT NULL;
ALTER TABLE sch_leangsp.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS client_uuid VARCHAR(50) NULL;
ALTER TABLE sch_leangsp.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sch_leangsp.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS comentarios JSONB DEFAULT '[]'::jsonb;

-- 6. ALTER tequ_equipo
ALTER TABLE sch_leangsp.tequ_equipo ADD COLUMN IF NOT EXISTS estado_mnt VARCHAR(30) DEFAULT 'OPERATIVO';
ALTER TABLE sch_leangsp.tequ_equipo ADD COLUMN IF NOT EXISTS restriccion_operacion TEXT NULL;

-- 7. TABLAS NUEVAS SPEC 67

-- A. tmnt_hallazgo
CREATE TABLE IF NOT EXISTS sch_leangsp.tmnt_hallazgo (
    id_hallazgo BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_equipo BIGINT NOT NULL REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    id_ot_origen BIGINT NOT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot),
    sistema VARCHAR(3) NOT NULL,
    componente VARCHAR(150) NOT NULL,
    modo_falla VARCHAR(25) NOT NULL,
    descripcion TEXT NOT NULL,
    criticidad VARCHAR(4) NOT NULL CHECK (criticidad IN ('C1', 'C2', 'C3', 'C4')),
    afecta_izaje BOOLEAN NOT NULL DEFAULT false,
    fotos JSONB DEFAULT '[]'::jsonb,
    decision VARCHAR(30) NULL CHECK (decision IN ('RESUELTO_EN_OT', 'OT_DERIVADA', 'BACKLOG', 'RESTRICCION_OPERACION', 'FUERA_DE_SERVICIO')),
    restriccion_texto TEXT NULL,
    id_ot_derivada BIGINT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot),
    fecha_limite DATE NULL,
    requiere_recertificacion BOOLEAN DEFAULT false,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'EN_GESTION', 'CERRADO', 'DESCARTADO')),
    id_user_reporta BIGINT NULL,
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    id_user_decide BIGINT NULL,
    fecha_decision TIMESTAMPTZ NULL,
    id_user_cierra BIGINT NULL,
    fecha_cierre TIMESTAMPTZ NULL,
    foto_cierre TEXT NULL,
    motivo_descarte TEXT NULL,
    client_uuid VARCHAR(50) NULL
);

-- B. tmnt_aviso (Bitácora real de averías/paradas)
CREATE TABLE IF NOT EXISTS sch_leangsp.tmnt_aviso (
    id_aviso BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    folio_aviso VARCHAR(50) NOT NULL,
    id_equipo BIGINT NOT NULL REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    ubicacion TEXT NULL,
    criticidad VARCHAR(30) NOT NULL CHECK (criticidad IN ('PARADA_MAQUINA', 'DEGRADADO', 'OBSERVACION')),
    descripcion TEXT NOT NULL,
    horometro NUMERIC(10,2) NULL,
    fotos JSONB DEFAULT '[]'::jsonb,
    id_user_reporta BIGINT NULL,
    fecha_reporte TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CON_OT', 'DESCARTADO')),
    id_ot BIGINT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot),
    motivo_descarte TEXT NULL,
    client_uuid VARCHAR(50) NULL,
    UNIQUE (id_empresa, folio_aviso)
);

-- C. tmnt_pauta_tarea (Catálogo de tareas según pauta)
CREATE TABLE IF NOT EXISTS sch_leangsp.tmnt_pauta_tarea (
    id_pauta_tarea BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    codigo_pauta VARCHAR(10) NOT NULL,
    familia_equipo VARCHAR(50) NOT NULL DEFAULT 'GENERICA',
    descripcion TEXT NOT NULL,
    horas_estimadas NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    orden INTEGER NOT NULL DEFAULT 1,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- D. tmnt_ot_estado_log (Auditoría inmutable de transiciones de OT)
CREATE TABLE IF NOT EXISTS sch_leangsp.tmnt_ot_estado_log (
    id_log BIGSERIAL PRIMARY KEY,
    id_ot BIGINT NOT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot) ON DELETE CASCADE,
    estado_anterior VARCHAR(25) NOT NULL,
    estado_nuevo VARCHAR(25) NOT NULL,
    id_user BIGINT NULL,
    motivo TEXT NULL,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- E. tmnt_ot_survey (Vínculo determinista OT <-> Surveys PRE/POST)
CREATE TABLE IF NOT EXISTS sch_leangsp.tmnt_ot_survey (
    id_ot_survey BIGSERIAL PRIMARY KEY,
    id_ot BIGINT NOT NULL REFERENCES sch_leangsp.tmnt_ot(id_ot) ON DELETE CASCADE,
    id_survey BIGINT NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('PRE', 'POST')),
    estado_resultado VARCHAR(30) NULL,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_ot, tipo)
);

-- F. tmnt_parametro (Parámetros operacionales editables de taller)
CREATE TABLE IF NOT EXISTS sch_leangsp.tmnt_parametro (
    id_empresa BIGINT NOT NULL,
    clave VARCHAR(50) NOT NULL,
    valor TEXT NOT NULL,
    fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    id_user BIGINT NULL,
    PRIMARY KEY (id_empresa, clave)
);

-- Índices de aceleración
CREATE INDEX IF NOT EXISTS idx_tmnt_ot_empresa_estado ON sch_leangsp.tmnt_ot (id_empresa, estado);
CREATE INDEX IF NOT EXISTS idx_tmnt_ot_equipo ON sch_leangsp.tmnt_ot (id_equipo);
CREATE INDEX IF NOT EXISTS idx_tmnt_hallazgo_ot ON sch_leangsp.tmnt_hallazgo (id_ot_origen);
CREATE INDEX IF NOT EXISTS idx_tmnt_hallazgo_equipo ON sch_leangsp.tmnt_hallazgo (id_equipo, estado);
CREATE INDEX IF NOT EXISTS idx_tmnt_aviso_empresa ON sch_leangsp.tmnt_aviso (id_empresa, estado);
