-- =============================================================================
-- SCRIPT DE SEEDING: TEMPLATE PLAN DE IZAJE DIGITAL (GSP)
-- Empresa: Grúas San Pablo (id_empresa = 9)
-- Flujo: FES_DIRECTA (id_flow_tmpl = 1)
-- Versión: 1.0 (Memoria de Maniobra & Compuerta de Seguridad 85%)
-- =============================================================================

INSERT INTO tsrv_templates (
    codi_template_srv,
    name_template_srv,
    desc_template_srv,
    id_empresa,
    id_flow_tmpl,
    json_template,
    flag_active
) VALUES (
    'TMPL-GSP-PLAN-IZAJE',
    'Plan de Izaje y Memoria de Maniobra',
    'Cálculo técnico de capacidad, geometría de pluma, aparejos de levante, verificación de suelo/clima y compuerta dura de seguridad al 85% con firmas FES.',
    9,
    1,
    '{
      "code": "TMPL-GSP-PLAN-IZAJE",
      "title": "PLAN DE IZAJE Y MEMORIA DE MANIOBRA",
      "description": "Cálculo técnico de capacidad, geometría de pluma, aparejos y compuerta de seguridad al 85%",
      "version": "1.0",
      "segments": [
        {
          "title": "1. DATOS GENERALES Y CLASIFICACIÓN DEL IZAJE",
          "posicion": 1,
          "collapsible": false,
          "attributes": [
            { "name": "num_ot", "label": "Código del Proyecto / N° OT", "type": "textField", "required": true },
            { "name": "fecha_plan", "label": "Fecha de la Maniobra", "type": "datePicker", "required": true },
            { "name": "hora_inicio", "label": "Hora Estimada de Inicio", "type": "textField", "required": true },
            { "name": "hora_termino", "label": "Hora Estimada de Término", "type": "textField", "required": true },
            { "name": "nombre_faena", "label": "Faena / Ubicación Exacta", "type": "textField", "required": true },
            { "name": "placa_patente_grua", "label": "Patente de la Grúa", "type": "textField", "required": true },
            { "name": "marca_modelo_grua", "label": "Marca y Modelo del Equipo", "type": "textField", "required": true },
            { "name": "nombre_rigger", "label": "Rigger / Encargado de Maniobra", "type": "textField", "required": true },
            { "name": "nombre_operador", "label": "Operador de Grúa", "type": "textField", "required": true },
            {
              "name": "tipo_carga",
              "label": "Tipo de Carga a Izar",
              "type": "comboBox",
              "default": "NEUTRA",
              "required": true,
              "values": {
                "quest": "Clasificación de Carga",
                "selected": "NEUTRA",
                "options": [
                  { "id": "NEUTRA", "label": "Neutra (Estructuras, Bultos Generales)", "value": "NEUTRA" },
                  { "id": "PELIGROSA", "label": "Peligrosa (Químicos, Estanques, Alta Complejidad)", "value": "PELIGROSA" },
                  { "id": "IMPORTANTE", "label": "Importante / Alto Valor (Maquinaria Crítica)", "value": "IMPORTANTE" },
                  { "id": "HUMANA", "label": "Carga Humana (Canastillo de Personal)", "value": "HUMANA" }
                ]
              }
            }
          ]
        },
        {
          "title": "2. GEOMETRÍA DE OPERACIÓN Y CÁLCULO DE CAPACIDAD",
          "posicion": 2,
          "collapsible": false,
          "attributes": [
            { "name": "peso_neto_carga_kg", "label": "1. Peso Neto a Izar (kg)", "type": "decimal", "default": "", "required": true },
            { "name": "radio_max_operacion_m", "label": "2. Radio Máximo de Operación (metros)", "type": "decimal", "default": "", "required": true },
            { "name": "largo_max_pluma_m", "label": "3. Largo de Pluma Requerido (metros)", "type": "decimal", "default": "", "required": true },
            { "name": "capacidad_radio_tabla_kg", "label": "4. Capacidad de Izaje según Tabla en Radio Máx (kg)", "type": "decimal", "default": "", "required": true },
            { "name": "peso_gancho_cable_kg", "label": "5. Peso Gancho y Cable (kg)", "type": "decimal", "default": "500", "required": true },
            { "name": "peso_aparejos_kg", "label": "6. Peso de Elementos de Estrobado (kg)", "type": "decimal", "default": "100", "required": true },
            { "name": "peso_yugo_kg", "label": "7. Peso del Yugo / Separador (kg) (0 si no aplica)", "type": "decimal", "default": "0", "required": true },
            { "name": "peso_total_carga_calculado", "label": "8. Peso Total Bruto de la Carga (kg) [Calculado: 1+5+6+7]", "type": "textField", "required": true },
            { "name": "porcentaje_capacidad_grua", "label": "9. % Utilización de Grúa [Calculado: (Peso Total / Capacidad Tabla) x 100]", "type": "textField", "required": true },
            {
              "name": "evaluacion_capacidad_85",
              "label": "Compuerta de Aprobación (Máximo 85%)",
              "type": "comboBox",
              "default": "",
              "required": true,
              "values": {
                "quest": "Estado de Utilización",
                "selected": "",
                "options": [
                  { "id": "APROBADO_MENOR_85", "label": "🟢 CONFORME - Utilización ≤ 85%", "value": "APROBADO_MENOR_85" },
                  { "id": "RECHAZADO_MAYOR_85", "label": "🔴 BLOQUEADO - Utilización > 85% (Prohibido Izar)", "value": "RECHAZADO_MAYOR_85" }
                ]
              }
            }
          ]
        },
        {
          "title": "3. APAREJOS DE LEVANTE Y CONDICIONES DE TERRENO",
          "posicion": 3,
          "collapsible": false,
          "attributes": [
            {
              "name": "check_estrobo_acero",
              "label": "Estrobos de Acero (Tipo, Diámetro, Capacidad y Factor Seg. 5:1)",
              "type": "photoCheck",
              "default": "",
              "hasCantidad": true,
              "unit": "unid",
              "options": [{ "id": "CONFORME", "label": "CONFORME" }, { "id": "NO_APLICA", "label": "N/A" }, { "id": "DANADO", "label": "DAÑADO" }]
            },
            {
              "name": "check_eslingas_sinteticas",
              "label": "Eslingas Sintéticas (Etiqueta visible, Capacidad y Factor Seg. 7:1)",
              "type": "photoCheck",
              "default": "",
              "hasCantidad": true,
              "unit": "unid",
              "options": [{ "id": "CONFORME", "label": "CONFORME" }, { "id": "NO_APLICA", "label": "N/A" }, { "id": "DANADO", "label": "DAÑADO" }]
            },
            {
              "name": "check_grilletes",
              "label": "Grilletes y Pasadores (Capacidad grabada, rosca en buen estado)",
              "type": "photoCheck",
              "default": "",
              "hasCantidad": true,
              "unit": "unid",
              "options": [{ "id": "CONFORME", "label": "CONFORME" }, { "id": "NO_APLICA", "label": "N/A" }, { "id": "DANADO", "label": "DAÑADO" }]
            },
            {
              "name": "condicion_suelo_soporte",
              "label": "Suelo y Estabilidad: ¿Terreno adecuado y uso obligatorio de almohadillas en platos?",
              "type": "comboBox",
              "default": "SI",
              "required": true,
              "values": {
                "quest": "Suelo Apto para Soporte",
                "selected": "SI",
                "options": [
                  { "id": "SI", "label": "SÍ - Terreno Compacto y Nivelado con Almohadillas", "value": "SI" },
                  { "id": "NO", "label": "NO - Terreno Blando / Inestable (Detener)", "value": "NO" }
                ]
              }
            },
            {
              "name": "condiciones_climaticas_ok",
              "label": "Clima: ¿Viento < 32 km/h, visibilidad adecuada y sin lluvia torrencial?",
              "type": "comboBox",
              "default": "SI",
              "required": true,
              "values": {
                "quest": "Condiciones Ambientales Aptas",
                "selected": "SI",
                "options": [
                  { "id": "SI", "label": "SÍ - Condiciones Ambientales Favorables", "value": "SI" },
                  { "id": "NO", "label": "NO - Viento > 32 km/h o Lluvia Extrema", "value": "NO" }
                ]
              }
            },
            { "name": "obs_maniobra", "label": "Observaciones Generales de la Maniobra", "type": "textField", "required": false }
          ]
        },
        {
          "title": "4. VALIDACIÓN FORMAL Y FIRMAS FES",
          "posicion": 4,
          "collapsible": false,
          "attributes": [
            { "name": "firma_rigger", "label": "Firma Digital Rigger / Encargado de Maniobras", "type": "signatureCapture", "required": true },
            { "name": "firma_operador", "label": "Firma Digital Operador de Grúa", "type": "signatureCapture", "required": true },
            { "name": "firma_prevencion", "label": "Firma Digital Prevención de Riesgos / Supervisor", "type": "signatureCapture", "required": false }
          ]
        }
      ]
    }'::jsonb,
    TRUE
)
ON CONFLICT (codi_template_srv) 
DO UPDATE SET 
    name_template_srv = EXCLUDED.name_template_srv,
    desc_template_srv = EXCLUDED.desc_template_srv,
    id_empresa = EXCLUDED.id_empresa,
    id_flow_tmpl = EXCLUDED.id_flow_tmpl,
    json_template = EXCLUDED.json_template,
    flag_active = EXCLUDED.flag_active;
