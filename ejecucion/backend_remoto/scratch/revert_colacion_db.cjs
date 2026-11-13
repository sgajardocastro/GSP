const pool = require('../src/config/postgresPool');

async function revertirColumnas() {
  try {
    console.log("Revertiendo columnas de colacion y horarios en sch_leangsp.tedp_reporte_avance...");
    await pool.query(`
      ALTER TABLE sch_leangsp.tedp_reporte_avance 
        DROP COLUMN IF EXISTS hora_inicio_colacion,
        DROP COLUMN IF EXISTS hora_termino_colacion,
        DROP COLUMN IF EXISTS hora_inicio,
        DROP COLUMN IF EXISTS hora_termino;
    `);
    console.log("✅ Columnas eliminadas exitosamente de PostgreSQL.");

    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'sch_leangsp' 
        AND table_name = 'tedp_reporte_avance'
        AND column_name LIKE '%hora%';
    `);
    console.log("Columnas restantes que contienen 'hora':", res.rows.map(r => r.column_name));
  } catch (err) {
    console.error("Error al revertir columnas:", err.message);
    process.exit(1);
  } finally {
    pool.end();
  }
}

revertirColumnas();
