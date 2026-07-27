const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public"
});

async function run() {
  await client.connect();
  const { rows } = await client.query(
    "SELECT id_proyecto, codi_proyecto, nombre_proyecto, json_field FROM sch_leangsp.tpry_proyecto ORDER BY id_proyecto DESC LIMIT 5"
  );
  console.log("Últimos proyectos guardados:");
  rows.forEach(r => {
    console.log(`\nID: ${r.id_proyecto} | Código: ${r.codi_proyecto} | Nombre: ${r.nombre_proyecto}`);
    console.log("crm_v1 siteVisit & coordenadas:", JSON.stringify(r.json_field?.crm_v1?.coordenadas_mapa, null, 2));
    console.log("crm_v1 full:", JSON.stringify(r.json_field?.crm_v1, null, 2));
  });
  await client.end();
}

run().catch(console.error);
