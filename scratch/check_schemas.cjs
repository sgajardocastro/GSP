const { Pool } = require('../ejecucion/backend_remoto/node_modules/pg');
const pool = new Pool({
  connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres'
});
async function check() {
  const client = await pool.connect();
  await client.query("SET search_path TO sch_leangsp, public");
  const tables = ['tedp_reporte_avance', 'tope_acta_plataforma', 'tequ_log_desplazamiento', 'tedp_estado_pago', 'tedp_estado_pago_detalle'];
  for (const t of tables) {
    const res = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = $1 ORDER BY ordinal_position",
      [t]
    );
    console.log('TABLE: ' + t);
    console.log(res.rows.map(r => r.column_name + ' (' + r.data_type + ')').join(', '));
    console.log('---');
  }
  client.release();
  pool.end();
}
check().catch(e => { console.error(e); pool.end(); });
