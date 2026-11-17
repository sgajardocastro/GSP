const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkPm2() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('su - nodeadmin -c "pm2 show 13"');
  console.log(res.stdout);
  ssh.dispose();
}
checkPm2().catch(console.error);
