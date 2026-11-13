-- =============================================================================
-- MIGRACIÓN / BACKFILL DETERMINISTA E IDEMPOTENTE: LÍNEAS DE SERVICIO Y ASIGNACIONES
-- ESQUEMA: sch_leangsp
-- FECHA: 13/11/2026
-- ESPECIFICACIÓN: .agents/specs/130_remediacion_relacional_y_motor_unico_valorizacion_e2e_spec.md
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
    v_proyectos_migrados INT := 0;
    v_lineas_migradas INT := 0;
    v_rel_equipos_vinculados INT := 0;
    v_rel_personas_vinculados INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando Backfill Determinista de Líneas de Servicio (SPEC-130)...';

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

            -- 1. Normalización de las 10 Unidades Canónicas
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
                -- Regla de fallback
                IF v_raw_desc ILIKE '%RIGGER%' OR v_raw_desc ILIKE '%ESTUDIO%' OR v_raw_desc ILIKE '%PLAN%' THEN
                    v_unidad := 'Valor Fijo';
                ELSE
                    v_unidad := 'Horas Diarias Minimas';
                END IF;
            END IF;

            -- 2. Clasificación de las 4 Líneas de Negocio (Acuerdo 11-Nov-2026)
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
                -- Grúas telescópicas, camiones pluma, horquillas, manipuladores
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

            -- 4. Invariantes de Cantidades y Fórmulas
            IF v_unidad IN ('Valor Fijo', 'Traslado Ida', 'Traslado Vuelta', 'Traslado Ida/Vuelta') THEN
                -- Grupo A: Cobro Único Inmutable
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

            -- Inserción relacional de la línea de servicio
            INSERT INTO sch_leangsp.tpry_linea_servicio (
                id_proyecto,
                id_linea_servicio_padre,
                linea_negocio,
                tipo_ot,
                rol_nodo,
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
                COALESCE(r_linea.elem->>'descripcion', r_linea.elem->>'concepto', 'Servicio Operativo'),
                r_linea.elem->>'subcategoria',
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

        -- 5. Backfill de Asignaciones Físicas de Equipos a la Línea Raíz
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

    RAISE NOTICE 'Backfill completado exitosamente: % proyectos procesados, % líneas de servicio creadas.', 
                 v_proyectos_migrados, v_lineas_migradas;
END $$;
