const path = require('path');
const baseDir = path.resolve(__dirname);
const dotenv = require(path.join(baseDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(baseDir, '.env') });
const { Pool } = require(path.join(baseDir, 'node_modules/pg'));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const astSimpleSeed = {
  "segmentos": [
    {
      "label": "1. DATOS GENERALES Y TAREA A EJECUTAR",
      "posicion": 1,
      "collapsible": false,
      "attributes": [
        { "type": "textField", "label": "Código del Proyecto / N° OT", "default": "", "nullable": false },
        { "type": "datePicker", "label": "Fecha de Evaluación", "default": "", "nullable": false },
        { "type": "textField", "label": "Nombre de Faena / Obra", "default": "", "nullable": false },
        { "type": "textField", "label": "Patente del Equipo / Grúa", "default": "", "nullable": false },
        { "type": "textField", "label": "Nombre del Operador", "default": "", "nullable": false },
        { "type": "textField", "label": "Nombre del Rigger / Ayudante", "default": "", "nullable": true },
        {
          "type": "comboBox",
          "label": "Tipo de Maniobra a Realizar",
          "nullable": false,
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
      "label": "2. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP) & HERRAMIENTAS",
      "posicion": 2,
      "collapsible": false,
      "attributes": [
        {
          "type": "comboBox",
          "label": "EPP Básico Completo (Casco, Barbiquejo, Zapatos de Seguridad, Lentes UV, Guantes, Chaleco Reflectante)",
          "nullable": false,
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
          "type": "comboBox",
          "label": "¿La maniobra requiere trabajo en altura / uso de arnés de seguridad?",
          "nullable": false,
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
          "type": "comboBox",
          "label": "Estado de herramientas y accesorios de apoyo",
          "nullable": false,
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
        { "type": "photoCapture", "label": "Fotografía de Evidencia (EPP / Entorno de Faena)", "nullable": true, "galeria": [], "obs": "", "maxFotos": 3, "obligatorioFotos": 0 }
      ]
    },
    {
      "label": "3. LOS 5 CONTROLES CRÍTICOS DE IZAJE (VERIFICACIÓN EN TERRENO)",
      "posicion": 3,
      "collapsible": false,
      "attributes": [
        {
          "type": "photoCheck",
          "label": "1. ⚡ Distancia a Líneas Eléctricas: ¿Se mantiene distancia de seguridad (≥ 5 metros) o línea desenergizada?",
          "nullable": false,
          "default": "",
          "hasCantidad": false,
          "hasVencimiento": false,
          "galeria": [],
          "obs": "",
          "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }, { "id": "NA", "label": "N/A" }],
          "compression": 10
        },
        {
          "type": "photoCheck",
          "label": "2. 🚜 Suelo y Estabilizadores: ¿Terreno firme/compactado, nivelado y almohadillas instaladas en gatos?",
          "nullable": false,
          "default": "",
          "hasCantidad": false,
          "hasVencimiento": false,
          "galeria": [],
          "obs": "",
          "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }],
          "compression": 10
        },
        {
          "type": "photoCheck",
          "label": "3. 🚧 Segregación y Carga Suspendida: ¿Radio de giro delimitado y prohibición de personas bajo la carga?",
          "nullable": false,
          "default": "",
          "hasCantidad": false,
          "hasVencimiento": false,
          "galeria": [],
          "obs": "",
          "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }],
          "compression": 10
        },
        {
          "type": "photoCheck",
          "label": "4. 💨 Viento y Clima: ¿Viento < 32 km/h, buena visibilidad y ausencia de tormenta eléctrica/lluvia severa?",
          "nullable": false,
          "default": "",
          "hasCantidad": false,
          "hasVencimiento": false,
          "galeria": [],
          "obs": "",
          "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }],
          "compression": 10
        },
        {
          "type": "photoCheck",
          "label": "5. 🪢 Aparejos y Comunicación: ¿Eslingas/grilletes inspeccionados sin cortes ni deformación, y señas acordadas con Rigger?",
          "nullable": false,
          "default": "",
          "hasCantidad": false,
          "hasVencimiento": false,
          "galeria": [],
          "obs": "",
          "options": [{ "id": "SI", "label": "SI" }, { "id": "NO", "label": "NO" }, { "id": "NA", "label": "N/A" }],
          "compression": 10
        },
        { "type": "textField", "label": "Observaciones o Medidas de Control Adicionales", "default": "", "nullable": true }
      ]
    },
    {
      "label": "4. DECLARACIÓN DE SEGURIDAD Y FIRMAS FES",
      "posicion": 4,
      "collapsible": false,
      "attributes": [
        {
          "type": "comboBox",
          "label": "Declaración del Trabajador: Confirmo que he verificado mi entorno y las condiciones son seguras para operar.",
          "nullable": false,
          "values": {
            "quest": "Declaración de Condiciones Seguras",
            "selected": "CONFORME",
            "options": [
              { "id": "CONFORME", "label": "✅ CONFORME - CONDICIONES SEGURAS", "value": "CONFORME" },
              { "id": "NO_CONFORME", "label": "⛔ NO CONFORME - PAUSA OPERATIVA", "value": "NO_CONFORME" }
            ]
          }
        },
        { "type": "signature", "label": "Firma Digital Operador", "default": "", "nullable": false },
        { "type": "signature", "label": "Firma Digital Rigger / Ayudante", "default": "", "nullable": true },
        { "type": "signature", "label": "Firma Digital Supervisor / Prevención de Riesgos", "default": "", "nullable": true }
      ]
    }
  ]
};

const planIzajeSeed = {
  "segmentos": [
    {
      "label": "1. DATOS GENERALES Y CLASIFICACIÓN DEL IZAJE",
      "posicion": 1,
      "collapsible": false,
      "attributes": [
        { "type": "textField", "label": "Código del Proyecto / N° OT", "default": "", "nullable": false },
        { "type": "datePicker", "label": "Fecha de la Maniobra", "default": "", "nullable": false },
        { "type": "textField", "label": "Hora Estimada de Inicio", "default": "", "nullable": false },
        { "type": "textField", "label": "Hora Estimada de Término", "default": "", "nullable": false },
        { "type": "textField", "label": "Faena / Ubicación Exacta", "default": "", "nullable": false },
        { "type": "textField", "label": "Patente de la Grúa", "default": "", "nullable": false },
        { "type": "textField", "label": "Marca y Modelo del Equipo", "default": "", "nullable": false },
        { "type": "textField", "label": "Rigger / Encargado de Maniobra", "default": "", "nullable": false },
        { "type": "textField", "label": "Operador de Grúa", "default": "", "nullable": false },
        {
          "type": "comboBox",
          "label": "Tipo de Carga a Izar",
          "nullable": false,
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
      "label": "2. GEOMETRÍA DE OPERACIÓN Y CÁLCULO DE CAPACIDAD",
      "posicion": 2,
      "collapsible": false,
      "attributes": [
        { "type": "decimal", "label": "1. Peso Neto a Izar (kg)", "default": "", "nullable": false, "cantiDec": 0 },
        { "type": "decimal", "label": "2. Radio Máximo de Operación (metros)", "default": "", "nullable": false, "cantiDec": 1 },
        { "type": "decimal", "label": "3. Largo de Pluma Requerido (metros)", "default": "", "nullable": false, "cantiDec": 1 },
        { "type": "decimal", "label": "4. Capacidad de Izaje según Tabla en Radio Máx (kg)", "default": "", "nullable": false, "cantiDec": 0 },
        { "type": "decimal", "label": "5. Peso Gancho y Cable (kg)", "default": "500", "nullable": false, "cantiDec": 0 },
        { "type": "decimal", "label": "6. Peso de Elementos de Estrobado (kg)", "default": "100", "nullable": false, "cantiDec": 0 },
        { "type": "decimal", "label": "7. Peso del Yugo / Separador (kg)", "default": "0", "nullable": false, "cantiDec": 0 },
        { "type": "textField", "label": "8. Peso Total Bruto de la Carga (kg) [Calculado: 1+5+6+7]", "default": "", "nullable": false },
        { "type": "textField", "label": "9. % Utilización de Grúa [Calculado: (Peso Total / Capacidad Tabla) x 100]", "default": "", "nullable": false },
        {
          "type": "comboBox",
          "label": "Compuerta de Aprobación (Máximo 85%)",
          "nullable": false,
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
      "label": "3. APAREJOS DE LEVANTE Y CONDICIONES DE TERRENO",
      "posicion": 3,
      "collapsible": false,
      "attributes": [
        {
          "type": "photoCheck",
          "label": "Estrobos de Acero (Tipo, Diámetro, Capacidad y Factor Seg. 5:1)",
          "default": "",
          "hasCantidad": true,
          "unit": "unid",
          "galeria": [],
          "obs": "",
          "options": [{ "id": "CONFORME", "label": "CONFORME" }, { "id": "NO_APLICA", "label": "N/A" }, { "id": "DANADO", "label": "DAÑADO" }]
        },
        {
          "type": "photoCheck",
          "label": "Eslingas Sintéticas (Etiqueta visible, Capacidad y Factor Seg. 7:1)",
          "default": "",
          "hasCantidad": true,
          "unit": "unid",
          "galeria": [],
          "obs": "",
          "options": [{ "id": "CONFORME", "label": "CONFORME" }, { "id": "NO_APLICA", "label": "N/A" }, { "id": "DANADO", "label": "DAÑADO" }]
        },
        {
          "type": "photoCheck",
          "label": "Grilletes y Pasadores (Capacidad grabada, rosca en buen estado)",
          "default": "",
          "hasCantidad": true,
          "unit": "unid",
          "galeria": [],
          "obs": "",
          "options": [{ "id": "CONFORME", "label": "CONFORME" }, { "id": "NO_APLICA", "label": "N/A" }, { "id": "DANADO", "label": "DAÑADO" }]
        },
        {
          "type": "comboBox",
          "label": "Suelo y Estabilidad: ¿Terreno adecuado y uso obligatorio de almohadillas en platos?",
          "nullable": false,
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
          "type": "comboBox",
          "label": "Clima: ¿Viento < 32 km/h, visibilidad adecuada y sin lluvia torrencial?",
          "nullable": false,
          "values": {
            "quest": "Condiciones Ambientales Aptas",
            "selected": "SI",
            "options": [
              { "id": "SI", "label": "SÍ - Condiciones Ambientales Favorables", "value": "SI" },
              { "id": "NO", "label": "NO - Viento > 32 km/h o Lluvia Extrema", "value": "NO" }
            ]
          }
        },
        { "type": "textField", "label": "Observaciones Generales de la Maniobra", "default": "", "nullable": true }
      ]
    },
    {
      "label": "4. VALIDACIÓN FORMAL Y FIRMAS FES",
      "posicion": 4,
      "collapsible": false,
      "attributes": [
        { "type": "signature", "label": "Firma Digital Rigger / Encargado de Maniobras", "default": "", "nullable": false },
        { "type": "signature", "label": "Firma Digital Operador de Grúa", "default": "", "nullable": false },
        { "type": "signature", "label": "Firma Digital Prevención de Riesgos / Supervisor", "default": "", "nullable": true }
      ]
    }
  ]
};

async function upsertTemplate(client, codi, name, desc, bodySeed) {
  const existing = await client.query("SELECT id_template FROM tsrv_templates WHERE codi_template_srv = $1", [codi]);
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id_template;
    await client.query(`
      UPDATE tsrv_templates
      SET name_template_srv = $1,
          desc_template_srv = $2,
          id_tipo_srv = 2,
          version = '1.0',
          estado = 'A',
          id_flow_tmpl = 1,
          flag_registro = TRUE,
          flag_autonomo = TRUE,
          body_seed = $3
      WHERE id_template = $4
    `, [name, desc, bodySeed, id]);
    return { action: 'UPDATE', id_template: id, codi_template_srv: codi, name_template_srv: name };
  } else {
    const res = await client.query(`
      INSERT INTO tsrv_templates (
        codi_template_srv,
        name_template_srv,
        desc_template_srv,
        id_tipo_srv,
        version,
        estado,
        id_flow_tmpl,
        flag_registro,
        flag_autonomo,
        body_seed
      ) VALUES ($1, $2, $3, 2, '1.0', 'A', 1, TRUE, TRUE, $4)
      RETURNING id_template, codi_template_srv, name_template_srv
    `, [codi, name, desc, bodySeed]);
    return { action: 'INSERT', ...res.rows[0] };
  }
}

async function seedSurveys() {
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO sch_leangsp, public");
    
    // 1. AST Simple
    console.log("⏳ Procesando Template AST Simple...");
    const resAst = await upsertTemplate(
      client,
      'TMPL-GSP-AST-SIMPLE',
      'Análisis Seguro de Trabajo (AST Simple)',
      'Evaluación ágil de riesgos pre-operacionales de izaje (60 seg)',
      astSimpleSeed
    );
    console.log(`✅ AST Simple [${resAst.action}]:`, resAst);

    // 2. Plan de Izaje
    console.log("\n⏳ Procesando Template Plan de Izaje...");
    const resPlan = await upsertTemplate(
      client,
      'TMPL-GSP-PLAN-IZAJE',
      'Plan de Izaje y Memoria de Maniobra',
      'Cálculo técnico de capacidad, pluma y compuerta de seguridad 85%',
      planIzajeSeed
    );
    console.log(`✅ Plan de Izaje [${resPlan.action}]:`, resPlan);

    // 3. Listar estado consolidado
    const checkAll = await client.query(
      `SELECT id_template, codi_template_srv, name_template_srv, id_tipo_srv, id_flow_tmpl, estado, flag_registro, flag_autonomo
       FROM tsrv_templates
       ORDER BY id_template ASC`
    );
    console.log("\n📋 Catálogo Consolidado de Templates en BD:");
    checkAll.rows.forEach(r => console.log(` [ID ${r.id_template}] ${r.codi_template_srv} - ${r.name_template_srv} (Flow: ${r.id_flow_tmpl}, Estado: ${r.estado})`));

  } catch (err) {
    console.error("❌ Error ejecutando seeding:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSurveys();
