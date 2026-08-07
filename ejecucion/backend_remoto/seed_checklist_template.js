require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const body_seed = {
  "segmentos": [
    {
      "label": "DATOS GENERALES",
      "posicion": 1,
      "attributes": [
        { "type": "textField", "label": "Código Negocio (OT)", "default": "", "nullable": false },
        {
          "type": "comboBox",
          "label": "Tipo de Operación",
          "nullable": false,
          "values": {
            "quest": "Seleccione tipo de operación",
            "selected": null,
            "options": [
              { "value": "ENTRADA", "label": "ENTRADA" },
              { "value": "SALIDA", "label": "SALIDA" }
            ]
          }
        },
        { "type": "textField", "label": "Categoría", "default": "", "nullable": false },
        { "type": "textField", "label": "Subcategoría", "default": "", "nullable": false },
        { "type": "textField", "label": "Nombre del Equipo", "default": "", "nullable": false },
        { "type": "textField", "label": "Patente", "default": "", "nullable": false },
        { "type": "textField", "label": "Nombre Operador", "default": "", "nullable": false },
        { "type": "photoCapture", "label": "Fotografías Generales", "nullable": true, "galeria": [], "obs": "", "maxFotos": 5, "obligatorioFotos": 0 }
      ]
    },
    {
      "label": "GENERALIDADES DEL EQUIPO",
      "posicion": 2,
      "attributes": [
        ...[
          "Estado de cabina",
          "Niveles de fluidos, refrigerantes, aceites de motor, hidraulicos, liquido de freno y aguas limpiaparabrisas",
          "Revision de filtraciones de fluidos (aire, refrigerante, aceite de motor e hidraulicos)",
          "Condicion de neumaticos (repuesto)",
          "Bocina",
          "Alarma de retroceso",
          "Luces de traslado y frenado",
          "Luces de trabajo, Baliza",
          "Espejos retrovisores",
          "Frenos",
          "Panel de instrumentos, mandos e indicadores en cabina",
          "Estabilizadores",
          "Estructura externa sin abolladuras, parabrisas intacto",
          "Asientos",
          "Cuñas (2 un)",
          "Gancho (Seguro antidesenganche)",
          "Condicion de mangueras (Baja, Alta Presion)",
          "Anemometro operativo",
          "Burbuja niveladora y/o pantalla con grados",
          "Sistema anticolision",
          "Plumines",
          "Sensor de angulo de pluma",
          "Radios de comunicacion",
          "Cilindros de levante y cilindros de extension de pluma",
          "Poleas",
          "Clavijas"
        ].flatMap((item, idx) => [
          {
            "type": "comboBox",
            "label": item,
            "nullable": false,
            "values": {
              "quest": item,
              "selected": null,
              "options": [
                { "value": "Bueno", "label": "Bueno" },
                { "value": "Regular", "label": "Regular" },
                { "value": "Malo", "label": "Malo" },
                { "value": "N/A", "label": "N/A" }
              ]
            }
          },
          { "type": "number", "label": `Cant. ${item}`, "default": "", "nullable": true },
          { "type": "textField", "label": `Obs. ${item}`, "default": "", "nullable": true }
        ]),
        { "type": "number", "label": "Contrapeso (Toneladas)", "default": "", "nullable": true },
        { "type": "photoCapture", "label": "Fotografías Generalidades", "nullable": true, "galeria": [], "obs": "", "maxFotos": 5, "obligatorioFotos": 0 }
      ]
    },
    {
      "label": "MANIOBRAS Y ELEMENTOS DE IZAJE",
      "posicion": 3,
      "attributes": [
        ...[
          "Grilletes",
          "Eslingas sinteticas y metalicas",
          "Estrobos",
          "Separadores",
          "Argollas",
          "Tecles de cadena y o palanca",
          "Ganchos de levante (Seguros de gancho)",
          "Cadena de levante",
          "Terminales y uniones",
          "Pastecas",
          "Toma chapas",
          "Barreta, Viento (Cuerda)",
          "Capachos, baldes, canastillos",
          "Cadenas, tensor (Spanset)",
          "Almohadillas, tacos",
          "Conos"
        ].flatMap(item => [
          {
            "type": "comboBox",
            "label": item,
            "nullable": false,
            "values": {
              "quest": item,
              "selected": null,
              "options": [
                { "value": "Bueno", "label": "Bueno" },
                { "value": "Regular", "label": "Regular" },
                { "value": "Malo", "label": "Malo" },
                { "value": "N/A", "label": "N/A" }
              ]
            }
          },
          { "type": "number", "label": `Cant. ${item}`, "default": "", "nullable": true },
          { "type": "textField", "label": `Obs. ${item}`, "default": "", "nullable": true }
        ]),
        { "type": "photoCapture", "label": "Fotografías Izaje", "nullable": true, "galeria": [], "obs": "", "maxFotos": 5, "obligatorioFotos": 0 }
      ]
    },
    {
      "label": "INSUMOS DE SEGURIDAD",
      "posicion": 4,
      "attributes": [
        ...[
          "Conos (5)",
          "Botiquin de primeros auxilios",
          "Triangulos",
          "Chaleco reflectante",
          "Linterna",
          "Cinta peligro",
          "Bandeja de contencion",
          "Gata (Toneladas)",
          "Cuna de madera",
          "Kit anti derrames"
        ].flatMap(item => [
          {
            "type": "comboBox",
            "label": item,
            "nullable": false,
            "values": {
              "quest": item,
              "selected": null,
              "options": [
                { "value": "SI", "label": "SI" },
                { "value": "NO", "label": "NO" },
                { "value": "N/A", "label": "N/A" }
              ]
            }
          },
          { "type": "number", "label": `Cant. ${item}`, "default": "", "nullable": true },
          { "type": "textField", "label": `Obs. ${item}`, "default": "", "nullable": true }
        ]),
        { "type": "photoCapture", "label": "Fotografías Insumos", "nullable": true, "galeria": [], "obs": "", "maxFotos": 5, "obligatorioFotos": 0 }
      ]
    },
    {
      "label": "PROTECCIÓN CONTRA INCENDIOS",
      "posicion": 5,
      "attributes": [
        {
          "type": "comboBox",
          "label": "Extintor Certificado",
          "nullable": false,
          "values": {
            "quest": "Extintor Certificado",
            "selected": null,
            "options": [
              { "value": "SI", "label": "SI" },
              { "value": "NO", "label": "NO" },
              { "value": "N/A", "label": "N/A" }
            ]
          }
        },
        { "type": "datePicker", "label": "Vencimiento Extintor", "default": "", "nullable": true },
        { "type": "textField", "label": "Tipo de Extintor", "default": "", "nullable": true },
        { "type": "photoCapture", "label": "Fotografías Extintor", "nullable": true, "galeria": [], "obs": "", "maxFotos": 5, "obligatorioFotos": 0 }
      ]
    },
    {
      "label": "DOCUMENTACIÓN DEL EQUIPO",
      "posicion": 6,
      "attributes": [
        ...[
          "Seguro de vehiculo",
          "Permiso de circulacion",
          "Revision tecnica",
          "Certificacion de equipo (Vigente)",
          "Manual de operador en cabina"
        ].flatMap(item => [
          {
            "type": "comboBox",
            "label": item,
            "nullable": false,
            "values": {
              "quest": item,
              "selected": null,
              "options": [
                { "value": "SI", "label": "SI" },
                { "value": "NO", "label": "NO" },
                { "value": "N/A", "label": "N/A" }
              ]
            }
          },
          { "type": "datePicker", "label": `Vencimiento ${item}`, "default": "", "nullable": true },
          { "type": "textField", "label": `Obs. ${item}`, "default": "", "nullable": true }
        ]),
        { "type": "photoCapture", "label": "Fotografías Documentación", "nullable": true, "galeria": [], "obs": "", "maxFotos": 5, "obligatorioFotos": 0 }
      ]
    },
    {
      "label": "CIERRE INSPECCIÓN",
      "posicion": 7,
      "attributes": [
        { "type": "textArea", "label": "Observaciones Generales", "default": "", "nullable": true },
        { "type": "signature", "label": "Firma Operador", "default": "", "nullable": false },
        { "type": "photoCapture", "label": "Fotografías Cierre", "nullable": true, "galeria": [], "obs": "", "maxFotos": 5, "obligatorioFotos": 0 }
      ]
    }
  ]
};

async function main() {
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO sch_leangsp, public");
    
    // Update body_seed for template 76
    const query = `
      UPDATE tsrv_templates
      SET body_seed = $1
      WHERE id_template = $2
    `;
    
    const values = [body_seed, 76];
    
    const res = await client.query(query, values);
    
    if (res.rowCount > 0) {
      console.log(`UPDATE OK: Template 76 actualizado correctamente con la nueva estructura JSON.`);
    } else {
      console.log(`Error: No se encontró el template 76.`);
    }
    
  } catch (err) {
    console.error("Error ejecutando UPDATE:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
