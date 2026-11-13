const pool = require('../src/config/postgresPool');

async function main() {
  const r1 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tequ_log_desplazamiento' ORDER BY ordinal_position");
  console.log("tequ_log_desplazamiento:", r1.rows.map(x => x.column_name));

  const r2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tsrv_survey' ORDER BY ordinal_position");
  console.log("tsrv_survey:", r2.rows.map(x => x.column_name));
  await pool.end();
}

main();
