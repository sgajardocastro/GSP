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

  const res = await ssh.execCommand('head -n 40 /home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
