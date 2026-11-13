import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const p = await client.query('SELECT id_proyecto, codi_proyecto, nombre_proyecto, json_field FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 98');
    const row = p.rows[0];
    console.log('Proyecto:', row.codi_proyecto, row.nombre_proyecto);
    console.log('Lineas servicio CRM:');
    const lines = row.json_field?.crm_v1?.lineas_servicio || [];
    console.log(JSON.stringify(lines, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
main();
