const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_reporte_avance, id_proyecto, fecha_reporte FROM sch_leangsp_prod.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 5;\\""');
  console.log(res.stdout.trim() || res.stderr);

  ssh.dispose();
}

run();
