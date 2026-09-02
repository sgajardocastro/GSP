-- =============================================================================
-- SCRIPT DE SEEDING: TEMPLATE AST SIMPLE (1 USUARIO / DUPLA) (GSP)
-- Empresa: Grúas San Pablo (id_empresa = 9)
-- Flujo: FES_DIRECTA (id_flow_tmpl = 1)
-- Versión: 1.0 (Análisis Seguro de Trabajo en 60 Segundos)
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
    'TMPL-GSP-AST-SIMPLE',
    'Análisis Seguro de Trabajo (AST / ART Simple)',
    'Evaluación pre-operacional rápida de riesgos de izaje para 1 operador o dupla operativa (EPP, 5 controles críticos de maniobra y firma digital FES).',
    9,
    1,
    '{
      "code": "TMPL-GSP-AST-SIMPLE",
      "title": "ANÁLISIS SEGURO DE TRABAJO (AST / ART SIMPLE)",
      "description": "Evaluación pre-operacional rápida de riesgos de izaje para 1 operador o dupla operativa",
      "version": "1.0",
      "segments": [
        {
          "title": "1. DATOS GENERALES Y TAREA A EJECUTAR",
          "posicion": 1,
          "collapsible": false,
          "attributes": [
            { "name": "num_ot", "label": "Código del Proyecto / N° OT", "type": "textField", "required": true },
            { "name": "fecha_ast", "label": "Fecha de Evaluación", "type": "datePicker", "required": true },
            { "name": "nombre_faena", "label": "Nombre de Faena / Obra", "type": "textField", "required": true },
            { "name": "placa_patente", "label": "Patente del Equipo / Grúa", "type": "textField", "required": true },
            { "name": "nombre_operador", "label": "Nombre del Operador", "type": "textField", "required": true },
            { "name": "nombre_rigger", "label": "Nombre del Rigger / Ayudante", "type": "textField", "required": false },
            {
              "name": "tipo_trabajo",
              "label": "Tipo de Maniobra / Trabajo a Realizar",
              "type": "comboBox",
              "default": "",
              "required": true,
              "values": {
                "quest": "Tipo de Maniobra a Realizar",
                "selected": "",
                "options": [
                  { "id": "IZAJE_GRUA", "label": "Izaje con Grúa Móvil", "value": "Izaje con Grúa Móvil" },
                  { "id": "CAMION_PLUMA", "label": "Carga y Descarga Camión Pluma", "value": "Carga y Descarga Camión Pluma" },
                  { "id": "MANIOBRA_CRITICA", "label": "Montaje / Maniobra Crítica", "value": "Montaje / Maniobra Crítica" },
                  { "id": "TRASLADO_FLOTA", "label": "Traslado / Desplazamiento en Ruta", "value": "Traslado / Desplazamiento en Ruta" },
                  { "id": "OTRO", "label": "Otro Trabajo Operativo", "value": "Otro Trabajo Operativo" }
                ]
              }
            }
          ]
        },
        {
          "title": "2. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP) & HERRAMIENTAS",
          "posicion": 2,
          "collapsible": false,
          "attributes": [
            {
              "name": "epp_basico_completo",
              "label": "¿Cuentas con tu EPP básico completo y en buen estado? (Casco con barbiquejo, lentes UV, zapatos de seguridad, chaleco reflectante y guantes)",
              "type": "comboBox",
              "default": "SI",
              "required": true,
              "values": {
                "quest": "EPP Básico Completo",
                "selected": "SI",
                "options": [
                  { "id": "SI", "label": "SÍ - EPP Completo y Conforme", "value": "SI" },
                  { "id": "NO", "label": "NO - EPP Incompleto / No Operar", "value": "NO" }
                ]
              }
            },
            {
              "name": "requiere_arnes",
              "label": "¿La maniobra requiere trabajo en altura / uso de arnés de seguridad?",
              "type": "comboBox",
              "default": "NO",
              "required": true,
              "values": {
                "quest": "Uso de Arnés de Seguridad",
                "selected": "NO",
                "options": [
                  { "id": "NO", "label": "NO - Trabajo a nivel de piso", "value": "NO" },
                  { "id": "SI_OK", "label": "SÍ - Arnés inspeccionado con doble cabo de vida", "value": "SI_OK" },
                  { "id": "SI_NO_DISP", "label": "SÍ - No disponible / Pausa operativa", "value": "SI_NO_DISP" }
                ]
              }
            },
            {
              "name": "herramientas_estado",
              "label": "Estado de herramientas y accesorios de apoyo",
              "type": "comboBox",
              "default": "SI",
              "required": true,
              "values": {
                "quest": "Herramientas de Apoyo Conformes",
                "selected": "SI",
                "options": [
                  { "id": "SI", "label": "Inspeccionadas y en Buen Estado", "value": "SI" },
                  { "id": "NO", "label": "Con Desperfectos / No Utilizar", "value": "NO" },
                  { "id": "NA", "label": "No Aplica", "value": "NA" }
                ]
              }
            },
            { "name": "foto_epp_entorno", "label": "Fotografía de Evidencia (EPP / Entorno de Faena)", "type": "photoCapture", "required": false }
          ]
        },
        {
          "title": "3. LOS 5 CONTROLES CRÍTICOS DE IZAJE (VERIFICACIÓN EN TERRENO)",
          "posicion": 3,
          "collapsible": false,
          "attributes": [
            {
              "name": "control_lineas_electricas",
              "label": "1. ⚡ Distancia a Líneas Eléctricas: ¿Se mantiene distancia de seguridad (≥ 5 metros) o línea desenergizada?",
              "type": "photoCheck",
              "default": "",
              "hasCantidad": false,
              "hasVencimiento": false,
              "galeria": [],
              "obs": "",
              "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }, { "id": "NA", "label": "N/A" }],
              "compression": 10
            },
            {
              "name": "control_estabilidad_suelo",
              "label": "2. 🚜 Suelo y Estabilizadores: ¿Terreno firme/compactado, nivelado y almohadillas instaladas en gatos?",
              "type": "photoCheck",
              "default": "",
              "hasCantidad": false,
              "hasVencimiento": false,
              "galeria": [],
              "obs": "",
              "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }],
              "compression": 10
            },
            {
              "name": "control_segregacion_area",
              "label": "3. 🚧 Segregación y Carga Suspendida: ¿Radio de giro delimitado y prohibición de personas bajo la carga?",
              "type": "photoCheck",
              "default": "",
              "hasCantidad": false,
              "hasVencimiento": false,
              "galeria": [],
              "obs": "",
              "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }],
              "compression": 10
            },
            {
              "name": "control_viento_clima",
              "label": "4. 💨 Viento y Clima: ¿Viento < 32 km/h, buena visibilidad y ausencia de tormenta eléctrica/lluvia severa?",
              "type": "photoCheck",
              "default": "",
              "hasCantidad": false,
              "hasVencimiento": false,
              "galeria": [],
              "obs": "",
              "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }],
              "compression": 10
            },
            {
              "name": "control_aparejos_maniobra",
              "label": "5. 🪢 Aparejos y Comunicación: ¿Eslingas/grilletes inspeccionados sin cortes ni deformación, y señas acordadas con Rigger?",
              "type": "photoCheck",
              "default": "",
              "hasCantidad": false,
              "hasVencimiento": false,
              "galeria": [],
              "obs": "",
              "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }, { "id": "NA", "label": "N/A" }],
              "compression": 10
            },
            { "name": "obs_medidas_control", "label": "Observaciones o Medidas de Control Adicionales", "type": "textField", "default": "", "required": false }
          ]
        },
        {
          "title": "4. DECLARACIÓN DE SEGURIDAD Y FIRMAS FES",
          "posicion": 4,
          "collapsible": false,
          "attributes": [
            {
              "name": "declaracion_compromiso",
              "label": "Declaración del Trabajador: Confirmo que he verificado mi entorno y las condiciones son seguras para operar.",
              "type": "comboBox",
              "default": "CONFORME",
              "required": true,
              "values": {
                "quest": "Declaración de Condiciones Seguras",
                "selected": "CONFORME",
                "options": [
                  { "id": "CONFORME", "label": "✅ CONFORME - CONDICIONES SEGURAS", "value": "CONFORME" },
                  { "id": "NO_CONFORME", "label": "⛔ NO CONFORME - PAUSA OPERATIVA", "value": "NO_CONFORME" }
                ]
              }
            },
            { "name": "firma_operador", "label": "Firma Digital Operador", "type": "signatureCapture", "required": true },
            { "name": "firma_rigger", "label": "Firma Digital Rigger / Ayudante (Opcional si aplica)", "type": "signatureCapture", "required": false },
            { "name": "firma_supervisor", "label": "Firma Digital Supervisor / Prevención de Riesgos (Opcional)", "type": "signatureCapture", "required": false }
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
