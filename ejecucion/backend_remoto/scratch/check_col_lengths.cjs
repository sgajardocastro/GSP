const pool = require('../src/config/dbConfig');

async function main() {
  const schema = process.env.DB_SCHEMA || 'sch_leangsp';
  const cols = await pool.query(`
    SELECT column_name, character_maximum_length, data_type 
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name = 'tedp_reporte_avance' AND character_maximum_length IS NOT NULL
  `);
  console.log('Columns with max length in tedp_reporte_avance:', cols.rows);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
