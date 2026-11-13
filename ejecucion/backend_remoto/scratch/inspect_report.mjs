import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const rows = await client.query(`
      SELECT *
      FROM sch_leangsp.tedp_reporte_avance
      ORDER BY id_reporte_avance DESC
      LIMIT 1;
    `);
    console.log('ÚLTIMO REPORT:');
    console.log(JSON.stringify(rows.rows[0], null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
main();
