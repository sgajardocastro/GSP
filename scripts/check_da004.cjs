const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkDa004() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('python3 -c "import socket; s = socket.socket(); s.settimeout(5); print(\'da004 465:\', s.connect_ex((\'da004.servidoresph.com\', 465))); s.close(); s2 = socket.socket(); s2.settimeout(5); print(\'da004 587:\', s2.connect_ex((\'da004.servidoresph.com\', 587))); s2.close()"');
  console.log(res.stdout);

  ssh.dispose();
}

checkDa004().catch(console.error);
