const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkHistory() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep -i "alfonso" /root/.bash_history | tail -n 10');
  console.log('bash history:', res.stdout);

  ssh.dispose();
}

checkHistory().catch(console.error);
