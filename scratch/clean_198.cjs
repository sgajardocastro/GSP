const { Client } = require('../ejecucion/backend_remoto/node_modules/pg');
const c = new Client({ connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres' });
async function cleanAll() {
  await c.connect();
  const ids = [198, 199, 200, 201, 202];
  for (const id of ids) {
    await c.query('DELETE FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = $1', [id]);
    await c.query('DELETE FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = $1', [id]);
    await c.query('DELETE FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = $1', [id]);
    await c.query('DELETE FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1', [id]);
    await c.query('DELETE FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1', [id]);
  }
  console.log('Proyectos 198 a 202 limpiados con éxito');
  await c.end();
}
cleanAll().catch(console.error);
