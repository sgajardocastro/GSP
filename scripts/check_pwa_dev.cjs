const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkPwaDev() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const r1 = await ssh.execCommand('cat /var/www/html/pwa-gsp-dev/index.html | head -25');
  console.log('PWA DEV INDEX:\\n', r1.stdout);

  ssh.dispose();
}

checkPwaDev().catch(console.error);
