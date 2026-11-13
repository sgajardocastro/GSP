-- =============================================================================
-- MIGRACIÓN / BACKFILL DETERMINISTA E IDEMPOTENTE: LÍNEAS DE SERVICIO Y ASIGNACIONES
-- ESQUEMA: sch_leangsp
-- FECHA: 13/11/2026
-- ESPECIFICACIÓN: SPEC-130 (MANDATO SENIOR DE SANITIZACIÓN RELACIONAL E2E)
-- =============================================================================

DO $$
DECLARE
    r_proy RECORD;
    r_linea RECORD;
    v_lineas_json JSONB;
    v_id_linea_raiz BIGINT;
    v_id_linea_actual BIGINT;
    v_linea_negocio VARCHAR(30);
    v_tipo_ot VARCHAR(30);
    v_rol_nodo VARCHAR(30);
    v_unidad VARCHAR(50);
    v_raw_unidad TEXT;
    v_raw_desc TEXT;
    v_cant NUMERIC(10,2);
    v_cant_dias NUMERIC(10,2);
    v_cant_horas NUMERIC(10,2);
    v_cant_meses NUMERIC(10,2);
    v_piso_hrs NUMERIC(10,2);
    v_val_unit NUMERIC(14,2);
    v_subtotal NUMERIC(14,2);
    v_incluido BOOLEAN;
    v_es_apoyo BOOLEAN;
    v_id_categoria INT;
    v_id_subcategoria INT;
    v_id_equipo_sugerido INT;
    v_glosa_subcategoria VARCHAR(100);
    v_proyectos_migrados INT := 0;
    v_lineas_migradas INT := 0;
    v_rel_equipos_vinculados INT := 0;
    v_rel_personas_vinculados INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando Backfill Determinista de Líneas de Servicio con IDs Relacionales (SPEC-130)...';

    -- Iterar proyectos que aún NO tengan líneas en tpry_linea_servicio
    FOR r_proy IN 
        SELECT p.id_proyecto, p.nombre_proyecto, p.json_field, p.id_usuario_creacion
        FROM sch_leangsp.tpry_proyecto p
        WHERE NOT EXISTS (
            SELECT 1 FROM sch_leangsp.tpry_linea_servicio ls WHERE ls.id_proyecto = p.id_proyecto
        )
        ORDER BY p.id_proyecto ASC
    LOOP
        v_id_linea_raiz := NULL;
        v_lineas_json := '[]'::jsonb;

        -- Prioridad de lectura de arreglos de líneas en json_field
        IF r_proy.json_field ? 'cotizaciones' AND jsonb_typeof(r_proy.json_field->'cotizaciones') = 'array' 
           AND jsonb_array_length(r_proy.json_field->'cotizaciones') > 0 
           AND r_proy.json_field->'cotizaciones'->-1 ? 'lineas_snapshot' 
           AND jsonb_typeof(r_proy.json_field->'cotizaciones'->-1->'lineas_snapshot') = 'array' THEN
            v_lineas_json := r_proy.json_field->'cotizaciones'->-1->'lineas_snapshot';
        ELSIF r_proy.json_field ? 'crm' AND jsonb_typeof(r_proy.json_field->'crm'->'lineas_servicio') = 'array' THEN
            v_lineas_json := r_proy.json_field->'crm'->'lineas_servicio';
        ELSIF r_proy.json_field ? 'crm_v1' AND jsonb_typeof(r_proy.json_field->'crm_v1'->'lineas_operativas_vigentes') = 'array' THEN
            v_lineas_json := r_proy.json_field->'crm_v1'->'lineas_operativas_vigentes';
        ELSIF r_proy.json_field ? 'crm_v1' AND jsonb_typeof(r_proy.json_field->'crm_v1'->'snapshot_comercial'->'lines') = 'array' THEN
            v_lineas_json := r_proy.json_field->'crm_v1'->'snapshot_comercial'->'lines';
        ELSIF r_proy.json_field ? 'crm_v1' AND jsonb_typeof(r_proy.json_field->'crm_v1'->'lineas_servicio') = 'array' THEN
            v_lineas_json := r_proy.json_field->'crm_v1'->'lineas_servicio';
        ELSIF r_proy.json_field ? 'servicios' AND jsonb_typeof(r_proy.json_field->'servicios') = 'array' THEN
            v_lineas_json := r_proy.json_field->'servicios';
        ELSIF r_proy.json_field ? 'lineas_servicio' AND jsonb_typeof(r_proy.json_field->'lineas_servicio') = 'array' THEN
            v_lineas_json := r_proy.json_field->'lineas_servicio';
        END IF;

        -- Si no hay líneas explícitas en JSON, crear un nodo raíz por defecto a partir del proyecto
        IF v_lineas_json IS NULL OR jsonb_array_length(v_lineas_json) = 0 THEN
            v_lineas_json := jsonb_build_array(
                jsonb_build_object(
                    'descripcion', COALESCE(r_proy.nombre_proyecto, 'Servicio Operativo Estándar'),
                    'unidad', 'Horas Diarias Minimas',
                    'cantidad', 1,
                    'cantidad_dias', 1,
                    'cantidad_horas', 8,
                    'valor_unitario', 0
                )
            );
        END IF;

        -- Procesar cada línea de servicio del proyecto
        FOR r_linea IN 
            SELECT 
                elem,
                ordinality AS pos
            FROM jsonb_array_elements(v_lineas_json) WITH ORDINALITY AS t(elem, ordinality)
        LOOP
            v_raw_desc := UPPER(COALESCE(r_linea.elem->>'descripcion', r_linea.elem->>'concepto', r_linea.elem->>'tipo', 'Servicio'));
            v_raw_unidad := UPPER(COALESCE(r_linea.elem->>'unidad', r_linea.elem->>'unidad_cobro', ''));
            v_val_unit := COALESCE(NULLIF(regexp_replace(COALESCE(r_linea.elem->>'valor_unitario', r_linea.elem->>'valorUnitario', r_linea.elem->>'tarifa', '0'), '[^0-9.]', '', 'g'), '')::numeric, 0.00);
            v_incluido := COALESCE((r_linea.elem->>'incluido_en_tarifa')::boolean, (r_linea.elem->>'incluido')::boolean, FALSE);
            v_es_apoyo := COALESCE((r_linea.elem->>'es_apoyo_operativo')::boolean, FALSE);

            -- 1. Normalización de las 10 Unidades Canónicas (SPEC-130)
            IF v_raw_unidad ILIKE '%IDA/VUELTA%' OR v_raw_unidad ILIKE '%IDA Y VUELTA%' OR (v_raw_unidad ILIKE '%TRASLADO%' AND v_raw_unidad ILIKE '%RETORNO%') THEN
                v_unidad := 'Traslado Ida/Vuelta';
            ELSIF v_raw_unidad ILIKE '%IDA%' AND NOT (v_raw_unidad ILIKE '%VUELTA%' OR v_raw_unidad ILIKE '%RETORNO%') THEN
                v_unidad := 'Traslado Ida';
            ELSIF (v_raw_unidad ILIKE '%VUELTA%' OR v_raw_unidad ILIKE '%RETORNO%') AND NOT v_raw_unidad ILIKE '%IDA%' THEN
                v_unidad := 'Traslado Vuelta';
            ELSIF v_raw_unidad ILIKE '%TRASLADO%' OR v_raw_unidad ILIKE '%FLETE%' OR v_raw_desc ILIKE '%TRASLADO%' OR v_raw_desc ILIKE '%FLETE%' THEN
                v_unidad := 'Traslado Ida/Vuelta';
            ELSIF v_raw_unidad ILIKE '%HORA%MES%' OR v_raw_unidad ILIKE '%HORAS%MES%' OR v_raw_unidad ILIKE '%BOLSA%' THEN
                v_unidad := 'Horas Mes Minimas';
            ELSIF v_raw_unidad ILIKE '%MES%' OR v_raw_unidad ILIKE '%MENSUAL%' THEN
                v_unidad := 'Valor Fijo Mensual';
            ELSIF v_raw_unidad ILIKE '%SEMAN%' THEN
                v_unidad := 'Valor Fijo Semanal';
            ELSIF v_raw_unidad ILIKE '%DIARIO%' OR v_raw_unidad ILIKE '%JORNADA%' OR v_raw_unidad ILIKE '%DIA%' THEN
                v_unidad := 'Valor Fijo Diario';
            ELSIF v_raw_unidad ILIKE '%EFECTIVA%' THEN
                v_unidad := 'Hora Efectiva';
            ELSIF v_raw_unidad ILIKE '%HORA%' OR v_raw_unidad ILIKE '%MINIMA%' OR v_raw_unidad ILIKE '%HRS%' THEN
                v_unidad := 'Horas Diarias Minimas';
            ELSIF v_raw_unidad ILIKE '%FIJO%' OR v_raw_unidad ILIKE '%ALZADA%' OR v_raw_unidad ILIKE '%CERRADO%' THEN
                v_unidad := 'Valor Fijo';
            ELSE
                IF v_raw_desc ILIKE '%RIGGER%' OR v_raw_desc ILIKE '%ESTUDIO%' OR v_raw_desc ILIKE '%PLAN%' THEN
                    v_unidad := 'Valor Fijo';
                ELSE
                    v_unidad := 'Horas Diarias Minimas';
                END IF;
            END IF;

            -- 2. Clasificación de las 4 Líneas de Negocio Canónicas
            IF v_raw_desc ILIKE '%TIJERA%' OR v_raw_desc ILIKE '%PLATAFORMA%' OR v_raw_desc ILIKE '%BRAZO ARTIC%' OR v_raw_desc ILIKE '%ALZA HOMBRE%' OR v_raw_desc ILIKE '%RENTAL%' OR v_raw_desc ILIKE '%DRY LEASE%' THEN
                v_linea_negocio := 'RENTAL';
                v_tipo_ot := 'OT-RENTAL';
            ELSIF v_raw_desc ILIKE '%CAMA BAJA%' OR v_raw_desc ILIKE '%RAMPLA%' OR v_raw_desc ILIKE '%FLETE PURO%' OR v_raw_desc ILIKE '%TRANSPORTE%' THEN
                v_linea_negocio := 'TRANSPORTE';
                v_tipo_ot := 'OT-FLETE';
            ELSIF v_raw_desc ILIKE '%RIGGER%' OR v_raw_desc ILIKE '%SUPERVISOR%' OR v_raw_desc ILIKE '%APR%' OR v_raw_desc ILIKE '%PREVENCION%' OR v_raw_desc ILIKE '%PLAN DE IZAJE%' OR v_raw_desc ILIKE '%ESTUDIO RIGGING%' OR v_raw_desc ILIKE '%MEMORIA%' THEN
                v_linea_negocio := 'PROFESIONAL';
                v_tipo_ot := 'OT-STAFF';
            ELSE
                v_linea_negocio := 'IZAJE';
                v_tipo_ot := 'OT-MANIOBRA';
            END IF;

            -- 3. Determinación de Rol Jerárquico en el Árbol
            IF r_linea.pos = 1 THEN
                v_rol_nodo := 'RAIZ';
            ELSIF v_es_apoyo OR v_raw_desc ILIKE '%APOYO%' OR v_raw_desc ILIKE '%CONTRAPESO%' OR v_raw_desc ILIKE '%ESCOLTA%' THEN
                v_rol_nodo := 'APOYO_OPERATIVO';
                v_es_apoyo := TRUE;
            ELSIF v_unidad ILIKE 'Traslado%' THEN
                v_rol_nodo := 'TRASLADO';
            ELSIF v_raw_desc ILIKE '%RIGGER%' OR v_raw_desc ILIKE '%PERSONAL%' OR v_raw_desc ILIKE '%OPERADOR%' THEN
                v_rol_nodo := 'PERSONAL';
            ELSIF v_raw_desc ILIKE '%BALANCIN%' OR v_raw_desc ILIKE '%CANASTILLO%' OR v_raw_desc ILIKE '%APAREJO%' THEN
                v_rol_nodo := 'ACCESORIO';
            ELSE
                v_rol_nodo := 'HIJO_COMERCIAL';
            END IF;

            -- 4. Resolución Determinista de IDs Relacionales (tequ_categoria / tequ_subcategoria / tequ_equipo)
            v_id_categoria := NULL;
            v_id_subcategoria := NULL;
            v_id_equipo_sugerido := NULL;
            v_glosa_subcategoria := NULL;

            -- Si viene equipo_asignado_id o equipo_id numérico
            IF r_linea.elem ? 'equipo_asignado_id' AND (r_linea.elem->>'equipo_asignado_id') ~ '^[0-9]+$' THEN
                v_id_equipo_sugerido := (r_linea.elem->>'equipo_asignado_id')::int;
            ELSIF r_linea.elem ? 'id_equipo_sugerido' AND (r_linea.elem->>'id_equipo_sugerido') ~ '^[0-9]+$' THEN
                v_id_equipo_sugerido := (r_linea.elem->>'id_equipo_sugerido')::int;
            END IF;

            -- Si tenemos equipo sugerido, consultar directamente sus claves foráneas en tequ_equipo / tequ_subcategoria
            IF v_id_equipo_sugerido IS NOT NULL THEN
                SELECT s.id_categoria, e.id_subcategoria, s.nombre_subcategoria
                INTO v_id_categoria, v_id_subcategoria, v_glosa_subcategoria
                FROM sch_leangsp.tequ_equipo e
                LEFT JOIN sch_leangsp.tequ_subcategoria s ON e.id_subcategoria = s.id_subcategoria
                WHERE e.id_equipo = v_id_equipo_sugerido;
            END IF;

            -- Si no se resolvió por equipo, resolver según claves relacionales de la BD
            IF v_id_categoria IS NULL THEN
                IF v_linea_negocio = 'RENTAL' THEN
                    v_id_categoria := 102; -- PLATAFORMAS
                    IF v_raw_desc ILIKE '%ELECTRICA%' AND v_raw_desc ILIKE '%TIJERA%' THEN
                        v_id_subcategoria := 134;
                    ELSIF v_raw_desc ILIKE '%DIESEL%' AND v_raw_desc ILIKE '%TIJERA%' THEN
                        v_id_subcategoria := 150;
                    ELSIF v_raw_desc ILIKE '%ELECTRICA%' AND v_raw_desc ILIKE '%ARTICULADA%' THEN
                        v_id_subcategoria := 126;
                    ELSIF v_raw_desc ILIKE '%DIESEL%' AND v_raw_desc ILIKE '%ARTICULADA%' THEN
                        v_id_subcategoria := 111;
                    ELSIF v_raw_desc ILIKE '%TELESCOPICA%' THEN
                        v_id_subcategoria := 130;
                    ELSE
                        v_id_subcategoria := 131; -- PLATAFORMA ELEVADORA
                    END IF;
                ELSIF v_linea_negocio = 'TRANSPORTE' THEN
                    v_id_categoria := 62; -- CAMIONES
                    IF v_raw_desc ILIKE '%SEMIREMOLQUE%' OR v_raw_desc ILIKE '%RAMPLA%' OR v_raw_desc ILIKE '%CAMA BAJA%' THEN
                        v_id_subcategoria := 84;
                    ELSIF v_raw_desc ILIKE '%PLATAFORMA%' THEN
                        v_id_subcategoria := 91;
                    ELSIF v_raw_desc ILIKE '%TRACTO%' THEN
                        v_id_subcategoria := 95;
                    ELSE
                        v_id_subcategoria := 93; -- CAMION
                    END IF;
                ELSIF v_linea_negocio = 'PROFESIONAL' THEN
                    v_id_categoria := 151; -- PERSONAL CERTIFICADO
                    IF v_raw_desc ILIKE '%RIGGER%' THEN
                        v_id_subcategoria := 160;
                    ELSIF v_raw_desc ILIKE '%OPERADOR%' THEN
                        v_id_subcategoria := 161;
                    ELSIF v_raw_desc ILIKE '%PREVENCION%' OR v_raw_desc ILIKE '%APR%' THEN
                        v_id_subcategoria := 162;
                    ELSE
                        v_id_subcategoria := 163;
                    END IF;
                ELSE
                    -- IZAJE
                    IF v_raw_desc ILIKE '%HORQUILLA%' THEN
                        v_id_categoria := 65;
                        v_id_subcategoria := 74;
                    ELSIF v_raw_desc ILIKE '%MANIPULADOR%' THEN
                        v_id_categoria := 70;
                        v_id_subcategoria := 79;
                    ELSIF v_raw_desc ILIKE '%PLUMA%' THEN
                        v_id_categoria := 62;
                        v_id_subcategoria := 71;
                    ELSE
                        v_id_categoria := 40; -- GRUAS TELESCOPICAS
                        IF v_raw_desc ILIKE '%400%' THEN v_id_subcategoria := 70;
                        ELSIF v_raw_desc ILIKE '%250%' THEN v_id_subcategoria := 68;
                        ELSIF v_raw_desc ILIKE '%220%' THEN v_id_subcategoria := 67;
                        ELSIF v_raw_desc ILIKE '%150%' THEN v_id_subcategoria := 66;
                        ELSIF v_raw_desc ILIKE '%100%' THEN v_id_subcategoria := 62;
                        ELSIF v_raw_desc ILIKE '%90%' THEN v_id_subcategoria := 60;
                        ELSIF v_raw_desc ILIKE '%75%' THEN v_id_subcategoria := 59;
                        ELSIF v_raw_desc ILIKE '%70%' THEN v_id_subcategoria := 54;
                        ELSIF v_raw_desc ILIKE '%55%' THEN v_id_subcategoria := 52;
                        ELSIF v_raw_desc ILIKE '%50%' THEN v_id_subcategoria := 50;
                        ELSIF v_raw_desc ILIKE '%40%' THEN v_id_subcategoria := 49;
                        ELSE v_id_subcategoria := 54; -- Default 70 Ton
                        END IF;
                    END IF;
                END IF;
            END IF;

            -- Glosa descriptiva oficial desde la base de datos
            IF v_glosa_subcategoria IS NULL AND v_id_subcategoria IS NOT NULL THEN
                SELECT nombre_subcategoria INTO v_glosa_subcategoria
                FROM sch_leangsp.tequ_subcategoria
                WHERE id_subcategoria = v_id_subcategoria;
            END IF;

            -- 5. Invariantes de Cantidades y Fórmulas
            IF v_unidad IN ('Valor Fijo', 'Traslado Ida', 'Traslado Vuelta', 'Traslado Ida/Vuelta') THEN
                v_cant := 1.00;
                v_cant_dias := NULL;
                v_cant_horas := NULL;
                v_cant_meses := NULL;
                v_piso_hrs := 0.00;
                v_subtotal := CASE WHEN v_incluido THEN 0.00 ELSE v_val_unit END;
            ELSIF v_unidad = 'Horas Diarias Minimas' THEN
                v_cant_dias := GREATEST(1.00, COALESCE((r_linea.elem->>'cantidad_dias')::numeric, (r_linea.elem->>'cantidad')::numeric, 1.00));
                v_piso_hrs := GREATEST(1.00, COALESCE((r_linea.elem->>'cantidad_horas')::numeric, (r_linea.elem->>'pisoMinimo')::numeric, 8.00));
                v_cant_horas := v_piso_hrs;
                v_cant := v_cant_dias;
                v_cant_meses := NULL;
                v_subtotal := CASE WHEN v_incluido THEN 0.00 ELSE (v_cant_dias * v_piso_hrs * v_val_unit) END;
            ELSIF v_unidad = 'Horas Mes Minimas' THEN
                v_cant_meses := GREATEST(1.00, COALESCE((r_linea.elem->>'cantidad_meses')::numeric, (r_linea.elem->>'cantidad')::numeric, 1.00));
                v_piso_hrs := GREATEST(1.00, COALESCE((r_linea.elem->>'cantidad_horas')::numeric, (r_linea.elem->>'pisoMinimo')::numeric, 180.00));
                v_cant_horas := v_piso_hrs;
                v_cant := v_cant_meses;
                v_cant_dias := NULL;
                v_subtotal := CASE WHEN v_incluido THEN 0.00 ELSE (v_cant_meses * v_piso_hrs * v_val_unit) END;
            ELSIF v_unidad = 'Hora Efectiva' THEN
                v_cant_horas := GREATEST(1.00, COALESCE((r_linea.elem->>'cantidad_horas')::numeric, (r_linea.elem->>'cantidad')::numeric, 1.00));
                v_cant := v_cant_horas;
                v_cant_dias := NULL;
                v_cant_meses := NULL;
                v_piso_hrs := 0.00;
                v_subtotal := CASE WHEN v_incluido THEN 0.00 ELSE (v_cant_horas * v_val_unit) END;
            ELSIF v_unidad = 'Valor Fijo Diario' THEN
                v_cant_dias := GREATEST(1.00, COALESCE((r_linea.elem->>'cantidad_dias')::numeric, (r_linea.elem->>'cantidad')::numeric, 1.00));
                v_cant := v_cant_dias;
                v_cant_horas := NULL;
                v_cant_meses := NULL;
                v_piso_hrs := 0.00;
                v_subtotal := CASE WHEN v_incluido THEN 0.00 ELSE (v_cant_dias * v_val_unit) END;
            ELSIF v_unidad = 'Valor Fijo Semanal' THEN
                v_cant := GREATEST(1.00, COALESCE((r_linea.elem->>'cantidad_semanas')::numeric, (r_linea.elem->>'cantidad')::numeric, 1.00));
                v_cant_dias := NULL;
                v_cant_horas := NULL;
                v_cant_meses := NULL;
                v_piso_hrs := 0.00;
                v_subtotal := CASE WHEN v_incluido THEN 0.00 ELSE (v_cant * v_val_unit) END;
            ELSIF v_unidad = 'Valor Fijo Mensual' THEN
                v_cant_meses := GREATEST(1.00, COALESCE((r_linea.elem->>'cantidad_meses')::numeric, (r_linea.elem->>'cantidad')::numeric, 1.00));
                v_cant := v_cant_meses;
                v_cant_dias := NULL;
                v_cant_horas := NULL;
                v_piso_hrs := 0.00;
                v_subtotal := CASE WHEN v_incluido THEN 0.00 ELSE (v_cant_meses * v_val_unit) END;
            ELSE
                v_cant := 1.00;
                v_piso_hrs := 0.00;
                v_subtotal := v_val_unit;
            END IF;

            -- Inserción relacional rigurosa en tpry_linea_servicio
            INSERT INTO sch_leangsp.tpry_linea_servicio (
                id_proyecto,
                id_linea_servicio_padre,
                linea_negocio,
                tipo_ot,
                rol_nodo,
                id_categoria,
                id_subcategoria,
                id_equipo_sugerido,
                descripcion,
                subcategoria,
                unidad,
                cantidad,
                cantidad_dias,
                cantidad_horas,
                cantidad_meses,
                piso_minimo_horas,
                valor_unitario,
                subtotal,
                incluido_en_tarifa,
                es_apoyo_operativo,
                metadata_json,
                id_user_creacion
            ) VALUES (
                r_proy.id_proyecto,
                CASE WHEN v_rol_nodo = 'RAIZ' THEN NULL ELSE v_id_linea_raiz END,
                v_linea_negocio,
                v_tipo_ot,
                v_rol_nodo,
                v_id_categoria,
                v_id_subcategoria,
                v_id_equipo_sugerido,
                COALESCE(r_linea.elem->>'descripcion', r_linea.elem->>'concepto', 'Servicio Operativo'),
                COALESCE(v_glosa_subcategoria, r_linea.elem->>'subcategoria', 'General'),
                v_unidad,
                v_cant,
                v_cant_dias,
                v_cant_horas,
                v_cant_meses,
                v_piso_hrs,
                v_val_unit,
                v_subtotal,
                v_incluido,
                v_es_apoyo,
                r_linea.elem,
                r_proy.id_usuario_creacion
            ) RETURNING id_linea_servicio INTO v_id_linea_actual;

            IF v_rol_nodo = 'RAIZ' AND v_id_linea_raiz IS NULL THEN
                v_id_linea_raiz := v_id_linea_actual;
            END IF;

            v_lineas_migradas := v_lineas_migradas + 1;
        END LOOP;

        -- 6. Backfill de Asignaciones Físicas de Equipos a la Línea Raíz
        IF v_id_linea_raiz IS NOT NULL THEN
            UPDATE sch_leangsp.tpry_rel_equipo
            SET id_linea_servicio = v_id_linea_raiz,
                activo = CASE WHEN estado_real IN ('CANCELADO', 'FINALIZADO', 'REEMPLAZADO') THEN FALSE ELSE TRUE END
            WHERE id_proyecto = r_proy.id_proyecto
              AND id_linea_servicio IS NULL;

            GET DIAGNOSTICS v_rel_equipos_vinculados = ROW_COUNT;

            -- Backfill de Personal Asignado a la Línea Raíz o Personal
            UPDATE sch_leangsp.tpry_rel_persona
            SET id_linea_servicio = COALESCE(
                (SELECT ls.id_linea_servicio 
                 FROM sch_leangsp.tpry_linea_servicio ls 
                 WHERE ls.id_proyecto = r_proy.id_proyecto 
                   AND ls.rol_nodo = 'PERSONAL' 
                 LIMIT 1),
                v_id_linea_raiz
            ),
            activo = CASE WHEN estado_real IN ('CANCELADO', 'FINALIZADO', 'REEMPLAZADO') THEN FALSE ELSE TRUE END
            WHERE id_proyecto = r_proy.id_proyecto
              AND id_linea_servicio IS NULL;

            GET DIAGNOSTICS v_rel_personas_vinculados = ROW_COUNT;
        END IF;

        v_proyectos_migrados := v_proyectos_migrados + 1;
    END LOOP;

    RAISE NOTICE 'Backfill completado exitosamente: % proyectos procesados, % líneas de servicio relacionales creadas.', 
                 v_proyectos_migrados, v_lineas_migradas;
END $$;
