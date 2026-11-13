const pool = require('../src/config/dbConfig');

async function main() {
  const schema = process.env.DB_SCHEMA || 'sch_leangsp';
  const cols = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name = 'tedp_reporte_avance'
    ORDER BY ordinal_position
  `);
  console.log('Columns of tedp_reporte_avance:');
  cols.rows.forEach(c => console.log(`${c.column_name} (${c.data_type}, nullable: ${c.is_nullable}, default: ${c.column_default})`));

  const cands = await pool.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = '${schema}' AND conrelid = '${schema}.tedp_reporte_avance'::regclass
  `);
  console.log('\nConstraints of tedp_reporte_avance:', cands.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
