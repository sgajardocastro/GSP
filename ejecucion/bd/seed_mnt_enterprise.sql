-- =============================================================================
-- SEEDING INICIAL: MANTENIMIENTO ENTERPRISE (SPEC 67)
-- Esquema: sch_leangsp
-- Empresa: 9 (Grúas San Pablo)
-- =============================================================================

SET search_path TO sch_leangsp, public;

-- 1. ROLES TALLER EN TSEC_ROLES (Si no existen)
INSERT INTO sch_leangsp.tsec_roles (name_rol, activo)
SELECT 'GSP_TALLER_PROG', true
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_TALLER_PROG');

INSERT INTO sch_leangsp.tsec_roles (name_rol, activo)
SELECT 'GSP_TALLER_APROB', true
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_TALLER_APROB');

INSERT INTO sch_leangsp.tsec_roles (name_rol, activo)
SELECT 'GSP_TALLER_EJEC', true
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_TALLER_EJEC');

-- 2. PARÁMETROS OPERACIONALES EN TMNT_PARAMETRO
INSERT INTO sch_leangsp.tmnt_parametro (id_empresa, clave, valor) VALUES
(9, 'capacidad_mecanicos', '5'),
(9, 'capacidad_horas_dia', '8'),
(9, 'capacidad_dias_semana', '5'),
(9, 'factor_disponibilidad_hh', '0.85'),
(9, 'tarifa_hh_default', '15000'),
(9, 'umbral_costo_ot_clp', '2000000'),
(9, 'pm_ventana_proxima_pct', '10'),
(9, 'ot_envejecida_dias_correctiva', '7'),
(9, 'ot_envejecida_dias_espera_repuestos', '3'),
(9, 'ot_envejecida_dias_general', '15'),
(9, 'cert_alerta_dias', '60,30,15,7')
ON CONFLICT (id_empresa, clave) DO UPDATE SET valor = EXCLUDED.valor;

-- 3. PAUTAS DE MANTENIMIENTO EN TMNT_PAUTA_TAREA
DELETE FROM sch_leangsp.tmnt_pauta_tarea WHERE id_empresa = 9 AND familia_equipo = 'GENERICA';

-- PM250
INSERT INTO sch_leangsp.tmnt_pauta_tarea (id_empresa, codigo_pauta, familia_equipo, descripcion, horas_estimadas, orden) VALUES
(9, 'PM250', 'GENERICA', 'Drenado cárter motor y reemplazo filtro primario de aceite', 1.5, 1),
(9, 'PM250', 'GENERICA', 'Purga y cambio de cartucho racor separador de agua combustible', 1.0, 2),
(9, 'PM250', 'GENERICA', 'Engrase forzado de corona de giro / tornamesa 360° y pasadores pluma', 1.0, 3),
(9, 'PM250', 'GENERICA', 'Inspección visual de fugas en banco de válvulas y cilindros hidráulicos', 1.0, 4),
(9, 'PM250', 'GENERICA', 'Inspección visual de cable de izaje, poleas y gancho motón', 1.0, 5),
(9, 'PM250', 'GENERICA', 'Verificación funcional de LMI/PAT y switch de fin de carrera anti-two-block', 1.0, 6),
(9, 'PM250', 'GENERICA', 'Revisión de niveles de refrigerante, líquido de frenos y aceite reductores', 0.5, 7);

-- PM500
INSERT INTO sch_leangsp.tmnt_pauta_tarea (id_empresa, codigo_pauta, familia_equipo, descripcion, horas_estimadas, orden) VALUES
(9, 'PM500', 'GENERICA', 'Reemplazo de elemento filtrante primario de aire de admisión', 1.0, 1),
(9, 'PM500', 'GENERICA', 'Reemplazo de filtros de retorno y respiraderos de estanque hidráulico', 1.5, 2),
(9, 'PM500', 'GENERICA', 'Revisión y rellenado de nivel de aceite en reductores de winche y giro', 1.0, 3),
(9, 'PM500', 'GENERICA', 'Verificación de torque de pernos de fijación de tornamesa/corona', 2.0, 4),
(9, 'PM500', 'GENERICA', 'Inspección de desgaste de zapatas/pastillas y tambores de frenos carrier', 1.5, 5);

-- PM1000
INSERT INTO sch_leangsp.tmnt_pauta_tarea (id_empresa, codigo_pauta, familia_equipo, descripcion, horas_estimadas, orden) VALUES
(9, 'PM1000', 'GENERICA', 'Reemplazo total de lubricante de transmisión y diferenciales motrices', 2.5, 1),
(9, 'PM1000', 'GENERICA', 'Reemplazo de cartucho de seguridad secundario de aire motor', 1.0, 2),
(9, 'PM1000', 'GENERICA', 'Toma de muestra de aceite hidráulico para laboratorio de análisis espectrométrico', 0.5, 3),
(9, 'PM1000', 'GENERICA', 'Inspección de patines de deslizamiento y desgaste de telescopaje de pluma', 2.0, 4),
(9, 'PM1000', 'GENERICA', 'Prueba de densidad de electrolito, bornes de batería y alternador', 1.0, 5);

-- PM2000
INSERT INTO sch_leangsp.tmnt_pauta_tarea (id_empresa, codigo_pauta, familia_equipo, descripcion, horas_estimadas, orden) VALUES
(9, 'PM2000', 'GENERICA', 'Reemplazo integral de fluido hidráulico del sistema (vaciado y lavado de estanque)', 4.0, 1),
(9, 'PM2000', 'GENERICA', 'Reemplazo de aceite sintético en reductores planetarios de winches y giro', 2.0, 2),
(9, 'PM2000', 'GENERICA', 'Inspección no destructiva de soldaduras en base de pluma y cilindro de levante', 3.0, 3),
(9, 'PM2000', 'GENERICA', 'Calibración y verificación de curvas de carga con pesas patrón de LMI/PAT', 3.0, 4);

-- ANUAL
INSERT INTO sch_leangsp.tmnt_pauta_tarea (id_empresa, codigo_pauta, familia_equipo, descripcion, horas_estimadas, orden) VALUES
(9, 'ANUAL', 'GENERICA', 'Inspección estructural mayor de grúa para renovación de certificación Bureau Veritas', 6.0, 1),
(9, 'ANUAL', 'GENERICA', 'Prueba de estabilidad y sobrecarga controlada según norma ASME B30.5', 4.0, 2),
(9, 'ANUAL', 'GENERICA', 'Auditoría de libro de vida, horómetros y vigencia de manuales de fabricante', 2.0, 3);

-- 4. TEMPLATES CHECKLIST PRE Y POST (TSRV_TEMPLATES)
DELETE FROM sch_leangsp.tsrv_templates WHERE codi_template_srv IN ('TMPL-GSP-MNT-PRE', 'TMPL-GSP-MNT-POST');
SELECT setval('sch_leangsp.tsrv_templates_id_template_seq', (SELECT COALESCE(MAX(id_template), 1) FROM sch_leangsp.tsrv_templates));

-- Template PRE: Recepción y Seguridad Taller
INSERT INTO sch_leangsp.tsrv_templates (
    codi_template_srv,
    name_template_srv,
    desc_template_srv,
    id_tipo_srv,
    version,
    estado,
    id_empresa_cliente,
    header_seed,
    body_seed,
    approval_seed,
    created,
    name_srv,
    codi_srv,
    description,
    id_flow_tmpl,
    flag_registro,
    flag_autonomo
) VALUES (
    'TMPL-GSP-MNT-PRE',
    'Checklist Pre-Trabajo Recepción y Seguridad Taller',
    'Inspección obligatoria recepción, horómetro, LOTO y EPP en taller',
    1,
    '1.0',
    'A',
    9,
    '{"title": "CHECKLIST PRE-TRABAJO Y LOTO", "empresa": "Grúas San Pablo", "tipo": "MNT_PRE"}'::jsonb,
    '{
      "segments": [
        {
          "title": "1. RECEPCIÓN Y CONDICIÓN INICIAL DEL EQUIPO",
          "attributes": [
            { "name": "patente_equipo", "label": "Patente del Equipo", "type": "textField", "required": true },
            { "name": "folio_ot", "label": "N° Folio OT", "type": "textField", "required": true },
            { "name": "horometro_recepcion", "label": "Horómetro a la Recepción (hrs)", "type": "textField", "required": true },
            { "name": "foto_horometro_display", "label": "Fotografía Tablero / Horómetro", "type": "photoCapture", "required": true },
            { "name": "foto_condicion_inicial", "label": "Fotografías de Condición Inicial (4 Lados)", "type": "photoCapture", "required": true }
          ]
        },
        {
          "title": "2. SEGURIDAD Y BLOQUEO LOTO (ENERGÍA CERO)",
          "attributes": [
            {
              "name": "matriz_seguridad_loto",
              "label": "Protocolo de Bloqueo y Aislamiento",
              "type": "matrizCheck",
              "columns": ["CUMPLE", "NO CUMPLE", "N/A", "OBSERVACION"],
              "items": [
                "Equipo en zona taller con pluma apoyada y outriggers recogidos",
                "Motor apagado, llave retirada, freno mano puesto y cuñas instaladas",
                "Candado y tarjeta LOTO personal instalados en cortacorriente",
                "Energía cero hidráulica: presión aliviada en banco y acumuladores",
                "Energía cero potencial: pluma y contrapesos bloqueados mecánicamente",
                "AST / ART de taller completado y firmado por cuadrilla",
                "Permisos especiales validados (Altura / Caliente / Confinado)",
                "EPP completo verificado (Casco, lentes, guantes, zapatos seguridad)"
              ]
            }
          ]
        }
      ]
    }'::jsonb,
    '{"requiere_firma": true, "cargo": "Técnico Mecánico Responsable"}'::jsonb,
    CURRENT_DATE,
    'Mantenimiento Pre-Trabajo',
    'SRV-MNT-PRE',
    'Protocolo de Recepción y LOTO Taller',
    1,
    true,
    true
);

-- Template POST: Liberación Técnica y Pruebas Operacionales
INSERT INTO sch_leangsp.tsrv_templates (
    codi_template_srv,
    name_template_srv,
    desc_template_srv,
    id_tipo_srv,
    version,
    estado,
    id_empresa_cliente,
    header_seed,
    body_seed,
    approval_seed,
    created,
    name_srv,
    codi_srv,
    description,
    id_flow_tmpl,
    flag_registro,
    flag_autonomo
) VALUES (
    'TMPL-GSP-MNT-POST',
    'Checklist Post-Trabajo Liberación y Pruebas',
    'Pruebas funcionales, seguridad LMI, retiro LOTO y liberación',
    1,
    '1.0',
    'A',
    9,
    '{"title": "CHECKLIST POST-TRABAJO Y LIBERACIÓN", "empresa": "Grúas San Pablo", "tipo": "MNT_POST"}'::jsonb,
    '{
      "segments": [
        {
          "title": "1. VERIFICACIÓN TÉCNICA Y LIBERACIÓN MECÁNICA",
          "attributes": [
            { "name": "horometro_termino", "label": "Horómetro de Término (hrs)", "type": "textField", "required": true },
            { "name": "foto_horometro_termino", "label": "Fotografía Horómetro Final", "type": "photoCapture", "required": true },
            { "name": "fotos_trabajo_concluido", "label": "Fotografías Trabajos Realizados", "type": "photoCapture", "required": true }
          ]
        },
        {
          "title": "2. PRUEBAS FUNCIONALES Y DISPOSITIVOS DE SEGURIDAD",
          "attributes": [
            {
              "name": "matriz_pruebas_liberacion",
              "label": "Pruebas de Funcionamiento y Seguridad",
              "type": "matrizCheck",
              "columns": ["BUENO", "REGULAR", "MALO", "N/A", "OBSERVACION"],
              "items": [
                "Torque verificado en uniones empernadas críticas intervenidas",
                "Circuito presurizado: sin fugas de aceite ni refrigerante",
                "Protecciones, tapas y guardas mecánicas reinstaladas",
                "Retiro de candados LOTO y orden/limpieza en puesto de trabajo",
                "Prueba de movimientos sin carga (levante, telescopaje, giro, patas)",
                "Prueba de frenos de winche principal, secundario y freno giro",
                "Limitador de momento de carga LMI/PAT operativo con corte verificado",
                "Switch fin de carrera anti-two-block operativo y calibrado",
                "Cables de izaje inspeccionados según norma de descarte ISO 4309",
                "Alarma de retroceso, bocina, luces de faena y baliza operativas"
              ]
            }
          ]
        },
        {
          "title": "3. CONCLUSIÓN Y ESTADO RESULTANTE",
          "attributes": [
            { "name": "evaluacion_final", "label": "Dictamen de Liberación", "type": "comboBox", "options": ["APROBADO_OPERATIVO", "APROBADO_CON_RESTRICCION", "RECHAZADO_FUERA_DE_SERVICIO"], "required": true },
            { "name": "detalle_restricciones", "label": "Restricciones Operacionales (si aplica)", "type": "textField", "required": false },
            { "name": "requiere_recertificacion", "label": "¿Requiere Inspección/Certificación de Tercero?", "type": "comboBox", "options": ["NO", "SI"], "required": true }
          ]
        }
      ]
    }'::jsonb,
    '{"requiere_firma": true, "cargo": "Supervisor de Taller"}'::jsonb,
    CURRENT_DATE,
    'Mantenimiento Post-Trabajo',
    'SRV-MNT-POST',
    'Protocolo de Liberación Técnica Taller',
    1,
    true,
    true
);
