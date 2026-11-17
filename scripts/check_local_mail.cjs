const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkLocalMail() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res1 = await ssh.execCommand('which sendmail; which postfix');
  console.log('Binarios mail:', res1.stdout);

  const res2 = await ssh.execCommand('systemctl status postfix | head -n 5');
  console.log('Postfix status:', res2.stdout || res2.stderr);

  ssh.dispose();
}

checkLocalMail().catch(console.error);
