-- ==============================================================================
-- Tabla: tpry_rel_persona (Asignación de Personal a Proyectos)
-- ==============================================================================
CREATE TABLE tpry_rel_persona (
    id_rel_persona SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_user INT NOT NULL,
    rol_asignado VARCHAR(100),
    fecha_plan_ini TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_plan_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    turnos_plan VARCHAR(100),
    horas_plan NUMERIC(8,2),
    fecha_real_ini TIMESTAMP WITH TIME ZONE,
    fecha_real_fin TIMESTAMP WITH TIME ZONE,
    horas_reales NUMERIC(8,2),
    estado_real VARCHAR(50) DEFAULT 'PROGRAMADO',
    observaciones TEXT,
    json_field JSONB DEFAULT '{}'::jsonb,
    id_user_creacion INT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tpry_rel_persona_proyecto FOREIGN KEY (id_proyecto) REFERENCES tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    CONSTRAINT fk_tpry_rel_persona_user FOREIGN KEY (id_user) REFERENCES tsec_users(id_user) ON DELETE RESTRICT,
    CONSTRAINT fk_tpry_rel_persona_creacion FOREIGN KEY (id_user_creacion) REFERENCES tsec_users(id_user) ON DELETE SET NULL,
    CONSTRAINT chk_fechas_plan_persona CHECK (fecha_plan_fin >= fecha_plan_ini),
    CONSTRAINT chk_fechas_real_persona CHECK (fecha_real_fin >= fecha_real_ini)
);

CREATE INDEX idx_tpry_rel_persona_proyecto ON tpry_rel_persona(id_proyecto);
CREATE INDEX idx_tpry_rel_persona_user ON tpry_rel_persona(id_user);
CREATE INDEX idx_tpry_rel_persona_fechas_plan ON tpry_rel_persona(fecha_plan_ini, fecha_plan_fin);

COMMENT ON TABLE tpry_rel_persona IS 'Asignación de personal (tsec_users) a proyectos con seguimiento de planificación y ejecución real.';

-- ==============================================================================
-- Tabla: tpry_rel_equipo (Asignación de Equipos a Proyectos)
-- ==============================================================================
CREATE TABLE tpry_rel_equipo (
    id_rel_equipo SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_equipo INT NOT NULL,
    rol_equipo VARCHAR(100),
    fecha_plan_ini TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_plan_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    turnos_plan VARCHAR(100),
    horas_plan NUMERIC(8,2),
    fecha_real_ini TIMESTAMP WITH TIME ZONE,
    fecha_real_fin TIMESTAMP WITH TIME ZONE,
    horas_reales NUMERIC(8,2),
    estado_real VARCHAR(50) DEFAULT 'PROGRAMADO',
    observaciones TEXT,
    json_field JSONB DEFAULT '{}'::jsonb,
    id_user_creacion INT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tpry_rel_equipo_proyecto FOREIGN KEY (id_proyecto) REFERENCES tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    CONSTRAINT fk_tpry_rel_equipo_equipo FOREIGN KEY (id_equipo) REFERENCES tequ_equipo(id_equipo) ON DELETE RESTRICT,
    CONSTRAINT fk_tpry_rel_equipo_creacion FOREIGN KEY (id_user_creacion) REFERENCES tsec_users(id_user) ON DELETE SET NULL,
    CONSTRAINT chk_fechas_plan_equipo CHECK (fecha_plan_fin >= fecha_plan_ini),
    CONSTRAINT chk_fechas_real_equipo CHECK (fecha_real_fin >= fecha_real_ini)
);

CREATE INDEX idx_tpry_rel_equipo_proyecto ON tpry_rel_equipo(id_proyecto);
CREATE INDEX idx_tpry_rel_equipo_equipo ON tpry_rel_equipo(id_equipo);
CREATE INDEX idx_tpry_rel_equipo_fechas_plan ON tpry_rel_equipo(fecha_plan_ini, fecha_plan_fin);

COMMENT ON TABLE tpry_rel_equipo IS 'Asignación de maquinarias y equipos (tequ_equipo) a proyectos con seguimiento de planificación y ejecución real.';
