const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_proyecto, codi_proyecto FROM sch_leangsp.tpry_proyecto ORDER BY id_proyecto DESC LIMIT 5;'"`);
  console.log('Proyectos DEV:\n', res.stdout);

  ssh.dispose();
}

main().catch(console.error);
