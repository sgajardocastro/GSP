-- =============================================================================
-- MIGRACIÓN DDL SQL: REMEDIACIÓN RELACIONAL, LÍNEAS DE SERVICIO Y ASIGNACIONES
-- ESQUEMA: sch_leangsp
-- FECHA: 13/11/2026
-- ESPECIFICACIÓN: .agents/specs/130_remediacion_relacional_y_motor_unico_valorizacion_e2e_spec.md
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS sch_leangsp;
SET search_path TO sch_leangsp, public;

-- -----------------------------------------------------------------------------
-- 1. TABLA CANÓNICA: tpry_linea_servicio (Árbol Relacional de Servicios y Tarifas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sch_leangsp.tpry_linea_servicio (
    id_linea_servicio BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    id_linea_servicio_padre BIGINT REFERENCES sch_leangsp.tpry_linea_servicio(id_linea_servicio) ON DELETE CASCADE,
    
    -- Clasificación Canónica de Negocio y Rol Jerárquico
    linea_negocio VARCHAR(30) NOT NULL CHECK (linea_negocio IN ('IZAJE', 'RENTAL', 'TRANSPORTE', 'PROFESIONAL')),
    tipo_ot VARCHAR(30) NOT NULL CHECK (tipo_ot IN ('OT-MANIOBRA', 'OT-RENTAL', 'OT-FLETE', 'OT-STAFF')),
    rol_nodo VARCHAR(30) NOT NULL CHECK (rol_nodo IN ('RAIZ', 'HIJO_COMERCIAL', 'APOYO_OPERATIVO', 'ACCESORIO', 'PERSONAL', 'TRASLADO')),
    
    -- Descripción y Metadatos Técnicos
    descripcion TEXT NOT NULL,
    subcategoria VARCHAR(100),
    id_equipo_sugerido INT REFERENCES sch_leangsp.tequ_equipo(id_equipo) ON DELETE SET NULL,
    
    -- Modalidad de Cobro Canónica (10 Unidades Limpias)
    unidad VARCHAR(50) NOT NULL CHECK (unidad IN (
        'Valor Fijo', 
        'Traslado Ida', 
        'Traslado Vuelta', 
        'Traslado Ida/Vuelta', 
        'Hora Efectiva', 
        'Horas Diarias Minimas', 
        'Horas Mes Minimas', 
        'Valor Fijo Diario', 
        'Valor Fijo Semanal', 
        'Valor Fijo Mensual'
    )),
    
    -- Magnitudes Cuantitativas de la Cotización
    cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (cantidad >= 0),
    cantidad_dias NUMERIC(10, 2),
    cantidad_horas NUMERIC(10, 2),
    cantidad_meses NUMERIC(10, 2),
    piso_minimo_horas NUMERIC(10, 2) DEFAULT 0.00 CHECK (piso_minimo_horas >= 0),
    
    -- Valores Financieros (Moneda Nacional CLP)
    valor_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (valor_unitario >= 0),
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    
    -- Banderas Operativas
    incluido_en_tarifa BOOLEAN NOT NULL DEFAULT FALSE,
    es_apoyo_operativo BOOLEAN NOT NULL DEFAULT FALSE,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoría de Creación y Edición
    id_user_creacion INT REFERENCES sch_leangsp.tsec_users(id_user) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint de No Auto-Dependencia Directa
    CONSTRAINT chk_no_auto_dependencia CHECK (
        id_linea_servicio_padre IS NULL OR id_linea_servicio_padre <> id_linea_servicio
    ),
    
    -- Constraint Invariante Grupo A (Cobros Únicos con Cantidad 1 y Piso 0)
    CONSTRAINT chk_invariante_cobro_unico CHECK (
        unidad NOT IN ('Valor Fijo', 'Traslado Ida', 'Traslado Vuelta', 'Traslado Ida/Vuelta') OR (
            cantidad = 1.00 AND COALESCE(piso_minimo_horas, 0.00) = 0.00
        )
    )
);

-- Índices de Rendimiento y Navegación del Árbol
CREATE INDEX IF NOT EXISTS idx_tpry_linea_servicio_proyecto ON sch_leangsp.tpry_linea_servicio(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tpry_linea_servicio_padre ON sch_leangsp.tpry_linea_servicio(id_linea_servicio_padre);
CREATE INDEX IF NOT EXISTS idx_tpry_linea_servicio_linea ON sch_leangsp.tpry_linea_servicio(linea_negocio);
CREATE INDEX IF NOT EXISTS idx_tpry_linea_servicio_unidad ON sch_leangsp.tpry_linea_servicio(unidad);
CREATE INDEX IF NOT EXISTS idx_tpry_linea_servicio_rol ON sch_leangsp.tpry_linea_servicio(rol_nodo);

COMMENT ON TABLE sch_leangsp.tpry_linea_servicio IS 'Tabla canónica del árbol de servicios, cotizaciones y apoyos operativos por proyecto (SPEC-130).';

-- -----------------------------------------------------------------------------
-- 2. NORMALIZACIÓN DE ASIGNACIONES: tpry_rel_equipo
-- -----------------------------------------------------------------------------
ALTER TABLE sch_leangsp.tpry_rel_equipo 
    ADD COLUMN IF NOT EXISTS id_linea_servicio BIGINT REFERENCES sch_leangsp.tpry_linea_servicio(id_linea_servicio) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_tpry_rel_equipo_linea ON sch_leangsp.tpry_rel_equipo(id_linea_servicio);

-- Índice de Unicidad Parcial: Previene duplicados o recursos zombis activos en la misma línea
CREATE UNIQUE INDEX IF NOT EXISTS uq_tpry_rel_equipo_linea_activo 
    ON sch_leangsp.tpry_rel_equipo (id_proyecto, id_equipo, COALESCE(id_linea_servicio, 0)) 
    WHERE estado_real NOT IN ('CANCELADO', 'FINALIZADO', 'REEMPLAZADO') AND activo = TRUE;

COMMENT ON COLUMN sch_leangsp.tpry_rel_equipo.id_linea_servicio IS 'Enlace relacional canónico a la línea de servicio contratada (SPEC-130).';

-- -----------------------------------------------------------------------------
-- 3. NORMALIZACIÓN DE ASIGNACIONES: tpry_rel_persona
-- -----------------------------------------------------------------------------
ALTER TABLE sch_leangsp.tpry_rel_persona 
    ADD COLUMN IF NOT EXISTS id_linea_servicio BIGINT REFERENCES sch_leangsp.tpry_linea_servicio(id_linea_servicio) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_tpry_rel_persona_linea ON sch_leangsp.tpry_rel_persona(id_linea_servicio);

-- Índice de Unicidad Parcial: Previene duplicados o personas zombis activas en el mismo rol y línea
CREATE UNIQUE INDEX IF NOT EXISTS uq_tpry_rel_persona_linea_activo 
    ON sch_leangsp.tpry_rel_persona (id_proyecto, id_user, rol_asignado, COALESCE(id_linea_servicio, 0)) 
    WHERE estado_real NOT IN ('CANCELADO', 'FINALIZADO', 'REEMPLAZADO') AND activo = TRUE;

COMMENT ON COLUMN sch_leangsp.tpry_rel_persona.id_linea_servicio IS 'Enlace relacional canónico a la línea de servicio contratada (SPEC-130).';
