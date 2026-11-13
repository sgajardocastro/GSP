const { Client } = require('pg');

async function fixProject97() {
  const client = new Client({
    host: 'servidor.leanglobal.cl',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp',
    password: 'usr_gsp_123'
  });
  client.on('error', () => {});
  await client.connect();

  console.log("🔍 Consultando proyecto 97...");
  const pRes = await client.query("SELECT id_proyecto, codi_proyecto, json_field FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 97");
  if (pRes.rows.length === 0) {
    console.log("Proyecto 97 no encontrado");
    return;
  }

  const proj = pRes.rows[0];
  const jf = proj.json_field || {};
  console.log("Estado previo inspecciones_patio['35']:", jf.ejecucion_v1?.preparacion_salida?.inspecciones_patio?.['35']);

  if (jf.ejecucion_v1?.preparacion_salida?.inspecciones_patio?.['35']) {
    jf.ejecucion_v1.preparacion_salida.inspecciones_patio['35'].operador_id = 19;
    jf.ejecucion_v1.preparacion_salida.inspecciones_patio['35'].jefe_patio_id = 19;

    await client.query("UPDATE sch_leangsp.tpry_proyecto SET json_field = $1 WHERE id_proyecto = 97", [jf]);
    console.log("✅ json_field de proyecto 97 actualizado con operador_id: 19 (Jorge Ponce)");
  }

  // Actualizar survey 280
  const sRes = await client.query("SELECT id_survey, id_user FROM sch_leangsp.tsrv_survey WHERE id_survey = 280");
  console.log("Estado previo survey 280:", sRes.rows[0]);

  if (sRes.rows.length > 0) {
    await client.query("UPDATE sch_leangsp.tsrv_survey SET id_user = 19 WHERE id_survey = 280");
    console.log("✅ Survey 280 actualizado con id_user: 19 (Jorge Ponce)");
  }

  await client.end();
}

fixProject97().catch(console.error);
