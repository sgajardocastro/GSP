const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectSnapLinesOrigin() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `sed -n '220,235p' /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/estadoPagoController.js`;
  const res = await ssh.execCommand(cmd);
  console.log('SNAP LINES ORIGIN:\n', res.stdout);

  ssh.dispose();
}

inspectSnapLinesOrigin().catch(console.error);
