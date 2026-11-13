const pool = require('../src/config/postgresPool');

async function testEdpData() {
  try {
    const repRes = await pool.query(`
      SELECT r.*,
             to_char(r.fecha_inicio_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_inicio,
             to_char(r.fecha_termino_servicio AT TIME ZONE 'America/Santiago', 'HH24:MI') AS hora_termino,
             e.patente, e.modelo, e.marca
      FROM sch_leangsp.tedp_reporte_avance r
      LEFT JOIN sch_leangsp.tequ_equipo e ON r.id_equipo = e.id_equipo
      WHERE r.id_proyecto = 103
      ORDER BY r.fecha_reporte ASC;
    `);

    console.log("Reports encontrados:", repRes.rows.length);
    repRes.rows.forEach((r, i) => {
      const hCol = Number(r.horas_colacion) || 0;
      const colacionStr = hCol > 0 ? `${hCol.toFixed(1)} hrs` : 'Sin colación (0 hrs)';
      console.log(`Día ${i+1}: Horario ${r.hora_inicio} a ${r.hora_termino} | Colación: ${colacionStr}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

testEdpData();
