const pool = require('../src/config/dbConfig.js');

async function run() {
  try {
    const res = await pool.query(`
      SELECT id_proyecto, codi_proyecto, id_proyecto_estado,
             json_field->'crm_v1'->'resumen_financiero' as res_fin,
             json_field->'crm_v1'->'lineas_servicio' as lineas,
             json_field->'ejecucion_v1'->'patente_grua' as patente_grua,
             json_field->'ejecucion_v1'->'recursos_asignados'->'equipos' as eq_asignados,
             json_field->'facturacion_v1' as facturacion,
             json_field->'financiero_pmo' as fin_pmo
      FROM tpry_proyecto
      WHERE json_field->'crm_v1' IS NOT NULL
      ORDER BY id_proyecto DESC
      LIMIT 10
    `);
    console.log('Sample financial data across projects:');
    for (const r of res.rows) {
      console.log(`\nOT: ${r.codi_proyecto} (Estado: ${r.id_proyecto_estado})`);
      console.log('  res_fin:', r.res_fin);
      console.log('  facturacion:', r.facturacion);
      console.log('  fin_pmo:', r.fin_pmo);
      if (r.lineas && Array.isArray(r.lineas)) {
        console.log('  lineas_servicio:');
        r.lineas.forEach(l => {
          console.log(`    - desc: ${l.descripcion || l.item || l.tipo_servicio}, patente: ${l.patente}, id_eq: ${l.id_equipo || l.equipo_asignado_id}, total: ${l.total || l.subtotal || l.precio_total || l.monto}`);
        });
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
