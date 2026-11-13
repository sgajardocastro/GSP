const pool = require('../src/config/dbConfig');

async function main() {
  const schema = process.env.DB_SCHEMA || 'sch_leangsp';
  const p = await pool.query(`SELECT id_proyecto, codi_proyecto, fecha_plan_ini, fecha_plan_fin, json_field FROM ${schema}.tpry_proyecto WHERE id_proyecto = 76`);
  const row = p.rows[0];
  console.log('OT 76 info:');
  console.log('codi_proyecto:', row.codi_proyecto);
  console.log('fecha_plan_ini:', row.fecha_plan_ini);
  console.log('fecha_plan_fin:', row.fecha_plan_fin);
  console.log('control_vivo_overrides:', JSON.stringify(row.json_field?.control_vivo_overrides, null, 2));
  console.log('ejecucion_v1:', JSON.stringify(row.json_field?.ejecucion_v1, null, 2));

  // Let's also check if there is an ITS for 76 in sch_leangsp
  const its = await pool.query(`SELECT * FROM ${schema}.tits_informe_termino WHERE id_proyecto = 76`);
  console.log('ITS for 76:', its.rows);

  // Check jornadas for 76 if any
  if (its.rows.length > 0) {
    const jor = await pool.query(`SELECT * FROM ${schema}.tits_jornada_detalle WHERE id_its = $1`, [its.rows[0].id_its]);
    console.log('Jornadas for 76 ITS:', jor.rows);
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
