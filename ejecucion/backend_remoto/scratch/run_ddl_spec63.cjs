const fs = require('fs');
const path = require('path');
const pool = require('../src/config/postgresPool');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, '../src/database/20261003_control_operativo_vivo_ddl.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log("Ejecutando migración DDL Spec 63...");
    await pool.query(sql);
    console.log("MIGRACION DDL EXITOSA");

    // Verificar columnas en tedp_reporte_avance
    const c1 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'sch_leangsp' AND table_name = 'tedp_reporte_avance'
      AND column_name IN ('fecha_transmision_termino', 'device_timestamp');
    `);
    console.log("Columnas en tedp_reporte_avance:", c1.rows);

    // Verificar columnas en tequ_log_desplazamiento
    const c2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'sch_leangsp' AND table_name = 'tequ_log_desplazamiento'
      AND column_name IN ('device_timestamp_salida', 'device_timestamp_llegada');
    `);
    console.log("Columnas en tequ_log_desplazamiento:", c2.rows);

    // Verificar tabla tnot_notification_web
    const c3 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'sch_leangsp' AND table_name = 'tnot_notification_web';
    `);
    console.log("Tabla tnot_notification_web:", c3.rows);

  } catch (err) {
    console.error("Error ejecutando migración:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
