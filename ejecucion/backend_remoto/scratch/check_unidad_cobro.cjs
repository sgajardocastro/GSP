const pool = require('../src/config/dbConfig');

async function main() {
  const schema = process.env.DB_SCHEMA || 'sch_leangsp';
  const vals = await pool.query(`SELECT DISTINCT unidad_cobro FROM ${schema}.tedp_reporte_avance`);
  console.log('Existing unidad_cobro values:', vals.rows);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
