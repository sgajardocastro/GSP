const pool = require('./src/config/postgresPool');

async function run() {
  try {
    const q1 = await pool.query(`
      SELECT 
        event_object_table, 
        trigger_name, 
        action_timing, 
        event_manipulation,
        action_statement
      FROM information_schema.triggers 
      WHERE trigger_schema = 'sch_leangsp' 
        AND event_object_table IN ('tmnt_ot', 'tmnt_ot_cierre', 'tmnt_ot_estado_log', 'tequ_equipo');
    `);
    console.log('=== TRIGGERS ===');
    console.log(JSON.stringify(q1.rows, null, 2));

    const q2 = await pool.query(`
      SELECT tgname, relname, proname, prosrc
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_proc p ON p.oid = t.tgfoid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'sch_leangsp'
        AND relname IN ('tmnt_ot', 'tmnt_ot_cierre', 'tmnt_ot_estado_log', 'tequ_equipo');
    `);
    console.log('=== PG_TRIGGER DETAILS ===');
    for (const row of q2.rows) {
      console.log(`Trigger: ${row.tgname} on Table: ${row.relname} Function: ${row.proname}`);
      console.log(row.prosrc);
      console.log('-----------------------------------');
    }

  } catch(e) {
    console.error('Error DB:', e);
  } finally {
    await pool.end();
  }
}

run();
