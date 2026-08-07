-- =============================================================================
-- SCRIPT DE MIGRACIÓN: Módulo de Acreditaciones y Analista de Gestión
-- Esquema: sch_leangsp
-- Fecha: 2026-08-07
-- Autor: Ecosistema LeanGlobal / Grúas San Pablo
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS sch_leangsp;

-- 1. Tabla de Encabezado de Acreditación de Proyecto
CREATE TABLE IF NOT EXISTS sch_leangsp.tpry_acreditacion (
    id_acreditacion SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    estado_acreditacion VARCHAR(50) DEFAULT 'EN_TRAMITE', -- EN_TRAMITE, OBSERVADO, ACREDITADO_OK, ALERTA_CRITICA
    id_user_comercial INT REFERENCES sch_leangsp.tsec_users(id_user),
    id_user_analista INT REFERENCES sch_leangsp.tsec_users(id_user),
    porcentaje_avance INT DEFAULT 0,
    fecha_inicio TIMESTAMP DEFAULT NOW(),
    fecha_aprobacion_final TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de Detalle Documental del Expediente
CREATE TABLE IF NOT EXISTS sch_leangsp.tpry_acreditacion_doc (
    id_acreditacion_doc SERIAL PRIMARY KEY,
    id_acreditacion INT NOT NULL REFERENCES sch_leangsp.tpry_acreditacion(id_acreditacion) ON DELETE CASCADE,
    nombre_requisito VARCHAR(255) NOT NULL,
    categoria_doc VARCHAR(100) DEFAULT 'EQUIPOS', -- EQUIPOS, PERSONAL, EMPRESA
    id_doc INT REFERENCES sch_leangsp.tfmg_file(id_doc),
    estado_doc VARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE, SUBIDO, APROBADO, RECHAZADO
    observacion_analista TEXT,
    fecha_vencimiento_doc DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Índices de optimización para el Kanban y la API REST
CREATE INDEX IF NOT EXISTS idx_tpry_acred_proyecto ON sch_leangsp.tpry_acreditacion(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tpry_acred_estado ON sch_leangsp.tpry_acreditacion(estado_acreditacion);
CREATE INDEX IF NOT EXISTS idx_tpry_acred_doc_acred ON sch_leangsp.tpry_acreditacion_doc(id_acreditacion);
CREATE INDEX IF NOT EXISTS idx_tpry_acred_doc_estado ON sch_leangsp.tpry_acreditacion_doc(estado_doc);
