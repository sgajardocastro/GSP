const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkRemoteMessageModel() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('head -n 35 /home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/messageModel.js');
  console.log('--- PROD MessageModel.js (head 35) ---');
  console.log(res.stdout);

  ssh.dispose();
}

checkRemoteMessageModel().catch(console.error);
