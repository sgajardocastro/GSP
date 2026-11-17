const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
const { Pool } = require('/home/nodeadmin/proyectos/lean-services-gsp/node_modules/pg');
const pool = new Pool({
  user: 'usr_leangsp',
  password: 'usr_gsp_123',
  host: 'localhost',
  database: 'postgres',
  port: 5432
});

async function run() {
  try {
    const res = await pool.query(\`
      SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, fecha_creacion
      FROM sch_leangsp.tpry_proyecto
      WHERE codi_proyecto ILIKE '%140%' 
         OR nombre_proyecto ILIKE '%140%'
         OR json_field::text ILIKE '%00140%'
      ORDER BY id_proyecto DESC
    \`);
    console.log('Proyectos encontrados:', JSON.stringify(res.rows, null, 2));

    if (res.rows.length > 0) {
      const pId = res.rows[0].id_proyecto;
      console.log('ID Proyecto:', pId);

      const pRow = await pool.query('SELECT json_field FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1', [pId]);
      console.log('\\n--- JSON_FIELD crm_v1 y ejecucion_v1 ---');
      console.log('crm_v1:', JSON.stringify(pRow.rows[0].json_field?.crm_v1, null, 2)?.slice(0, 1000));
      console.log('ejecucion_v1:', JSON.stringify(pRow.rows[0].json_field?.ejecucion_v1, null, 2)?.slice(0, 1000));

      const lines = await pool.query('SELECT * FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1', [pId]);
      console.log('\\n--- LINEAS DE SERVICIO (tpry_linea_servicio) ---', JSON.stringify(lines.rows, null, 2));

      const eqs = await pool.query('SELECT * FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = $1', [pId]);
      console.log('\\n--- EQUIPOS ASIGNADOS (tpry_rel_equipo) ---', JSON.stringify(eqs.rows, null, 2));

      const pers = await pool.query('SELECT * FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = $1', [pId]);
      console.log('\\n--- PERSONAS ASIGNADAS (tpry_rel_persona) ---', JSON.stringify(pers.rows, null, 2));

      const reps = await pool.query('SELECT id_reporte, dia_correlativo, id_equipo, fecha_reporte, estado_reporte, unidad_cobro, json_field FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = $1', [pId]);
      console.log('\\n--- REPORTES DE AVANCE (tedp_reporte_avance) ---', JSON.stringify(reps.rows, null, 2));

      const trips = await pool.query('SELECT id_log, token, tipo_trayecto, estado, odometro_salida, odometro_llegada FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = $1', [pId]);
      console.log('\\n--- DESPLAZAMIENTOS / VIAJES (tequ_log_desplazamiento) ---', JSON.stringify(trips.rows, null, 2));

      const its = await pool.query('SELECT * FROM sch_leangsp.tits_informe_termino WHERE id_proyecto = $1', [pId]);
      console.log('\\n--- ITS (tits_informe_termino) ---', JSON.stringify(its.rows, null, 2));

      const edp = await pool.query('SELECT * FROM sch_leangsp.tedp_estado_pago WHERE id_proyecto = $1', [pId]);
      console.log('\\n--- EDP (tedp_estado_pago) ---', JSON.stringify(edp.rows, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_140.js\n" + nodeScript + "\nEOF");
  const res = await ssh.execCommand('/home/nodeadmin/.nvm/versions/node/v16.20.2/bin/node /tmp/inspect_140.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);
  ssh.dispose();
}

main().catch(console.error);
