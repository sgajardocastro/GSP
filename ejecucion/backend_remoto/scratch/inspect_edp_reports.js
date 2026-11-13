const pool = require('../src/config/dbConfig.js');

async function run() {
  try {
    const sample = await pool.query("SELECT * FROM tedp_reporte_avance WHERE id_proyecto = 103 ORDER BY id_reporte_avance ASC");
    console.log(`Found ${sample.rows.length} rows for OT 103:`);
    for (const r of sample.rows) {
      console.log(`ID: ${r.id_reporte_avance}, Dia: ${r.dia_correlativo}, Fecha: ${r.fecha_reporte}`);
      console.log('  Fechas y Horas:', {
        fecha_inicio_servicio: r.fecha_inicio_servicio,
        fecha_termino_servicio: r.fecha_termino_servicio,
        horas_colacion: r.horas_colacion,
        horas_operadas: r.horas_operadas,
        horas_facturables: r.horas_facturables,
        horas_sobretiempo: r.horas_sobretiempo,
        ajustes_analista: r.ajustes_analista
      });
    }

    // Check all reports across any project
    const allReports = await pool.query("SELECT id_reporte_avance, id_proyecto, fecha_reporte, fecha_inicio_servicio, fecha_termino_servicio, horas_colacion, ajustes_analista FROM tedp_reporte_avance LIMIT 5");
    console.log('\nSample all reports:', allReports.rows);

    // Also check tits_jornada_detalle
    const itsJornadas = await pool.query("SELECT * FROM tits_jornada_detalle LIMIT 5");
    console.log('\nSample tits_jornada_detalle:', itsJornadas.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
