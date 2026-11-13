import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const q = `
      UPDATE sch_leangsp.tedp_reporte_avance
      SET 
        horas_minimas = 8.00,
        horas_sobretiempo = 1.00,
        horas_facturables = 9.00,
        horometro_termino = 4185.00
      WHERE id_reporte_avance = 14
      RETURNING id_reporte_avance, id_proyecto, dia_correlativo, horas_operadas, horas_minimas, horas_sobretiempo, horas_facturables, horometro_inicio, horometro_termino;
    `;
    const res = await client.query(q);
    console.log('✅ Report 14 actualizado con éxito:');
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (e) {
    console.error('Error actualizando report 14:', e);
  } finally {
    await client.end();
  }
}
main();
