const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const cmd = `node -e "
    const fs = require('fs');
    const content = fs.readFileSync('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/mantenimientoModel.js', 'utf8');
    const lines = content.split('\\n');
    console.log(lines.slice(1340, 1420).join('\\n'));
  "`;
  const res = await ssh.execCommand(cmd);
  console.log('Lineas 1340 a 1420 en remoto:\n', res.stdout);

  ssh.dispose();
}

run().catch(console.error);
