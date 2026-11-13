const pool = require('../src/config/dbConfig');

async function main() {
  const p89 = await pool.query(`
    SELECT id_proyecto, codi_proyecto, json_field->'control_vivo_overrides' as cv
    FROM sch_leangsp.tpry_proyecto
    WHERE id_proyecto = 89
  `);
  console.log('Project 89 cv:', JSON.stringify(p89.rows[0], null, 2));

  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp' AND table_name = 'tits_informe_termino'
  `);
  console.log('Columns of tits_informe_termino:', cols.rows.map(c => c.column_name));

  const itsList = await pool.query(`
    SELECT * FROM sch_leangsp.tits_informe_termino ORDER BY id_its DESC LIMIT 5
  `);
  console.log('Recent ITS:', itsList.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
