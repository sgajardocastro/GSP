const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const workerScript = `
const { Pool } = require('./node_modules/pg');

async function investigar() {
  const pool = new Pool({
    connectionString: 'postgres://usr_leangsp_prod:usr_gsp_prod_2026!@localhost:5432/postgres'
  });
  const client = await pool.connect();

  try {
    console.log('--- Proyecto 63 ---');
    const q1 = await client.query('SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 63');
    console.log(q1.rows);

    console.log('--- Reportes en tedp_reporte_avance para proyecto 63 ---');
    const q2 = await client.query('SELECT id_reporte_avance, id_proyecto, dia_correlativo, fecha_reporte, hora_inicio, hora_termino, horometro_inicio, horometro_termino, id_equipo FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 63 ORDER BY id_reporte_avance DESC');
    console.log(q2.rows);

    console.log('--- Viajes para proyecto 63 ---');
    const q3 = await client.query('SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente, tipo_trayecto, estado_trayecto, token_viaje, id_user_chofer, horometro_inicial, horometro_final FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_proyecto = 63');
    console.log(q3.rows);

    console.log('--- Ultimos reportes en general de la BD ---');
    const q4 = await client.query('SELECT id_reporte_avance, id_proyecto, dia_correlativo, fecha_reporte, hora_inicio, hora_termino, horometro_inicio, horometro_termino, id_equipo FROM sch_leangsp_prod.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 5');
    console.log(q4.rows);

  } catch (err) {
    console.error('Error investigando:', err);
  } finally {
    client.release();
    await pool.end();
  }
}
investigar();
`;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/investigar_p63.js\n${workerScript}\nEOF`);

  const res = await ssh.execCommand('node investigar_p63.js', {
    cwd: '/home/nodeadmin/proyectos/lean-services-gsp-prod'
  });

  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp-prod/investigar_p63.js');

  ssh.dispose();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
