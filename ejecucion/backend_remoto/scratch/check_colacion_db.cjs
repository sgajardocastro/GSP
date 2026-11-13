const pool = require('../src/config/postgresPool');

async function test() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'sch_leangsp' 
        AND table_name = 'tedp_reporte_avance' 
      ORDER BY ordinal_position;
    `);
    console.log('Columnas tedp_reporte_avance:');
    res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

test();
