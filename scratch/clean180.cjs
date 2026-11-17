const path = require('path');
const { Pool } = require('../ejecucion/backend_remoto/node_modules/pg');
const pool = new Pool({
  connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres',
  options: '-c search_path=sch_leangsp,public'
});

async function cleanAbove177() {
  console.log('Cleaning projects > 177...');
  await pool.query('DELETE FROM tope_acta_plataforma WHERE id_proyecto > 177');
  await pool.query('DELETE FROM tequ_log_desplazamiento WHERE id_proyecto > 177');
  await pool.query('DELETE FROM tedp_reporte_avance WHERE id_proyecto > 177');
  await pool.query('DELETE FROM tpry_rel_equipo WHERE id_proyecto > 177');
  await pool.query('DELETE FROM tpry_rel_persona WHERE id_proyecto > 177');
  await pool.query('DELETE FROM tpry_linea_servicio WHERE id_proyecto > 177');
  await pool.query('DELETE FROM tpry_proyecto WHERE id_proyecto > 177');
  console.log('Projects > 177 cleaned successfully.');
  pool.end();
}

cleanAbove177().catch(console.error);
