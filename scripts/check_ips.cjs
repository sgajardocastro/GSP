const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkIps() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const ipRes = await ssh.execCommand('ip -4 addr show');
  console.log('--- IPs en el servidor ---');
  console.log(ipRes.stdout);

  ssh.dispose();
}

checkIps().catch(console.error);
