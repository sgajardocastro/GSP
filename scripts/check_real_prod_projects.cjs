const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkRealProdProjects() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT id_proyecto, codi_proyecto, nombre_proyecto FROM sch_leangsp_prod.tpry_proyecto ORDER BY id_proyecto ASC LIMIT 10;'\"");
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  ssh.dispose();
}
checkRealProdProjects().catch(console.error);
