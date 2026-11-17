const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkPwaProd() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const r1 = await ssh.execCommand('cat /var/www/html/pwa-gsp-prod/index.html | head -25');
  console.log('PWA PROD INDEX:\\n', r1.stdout);

  const r2 = await ssh.execCommand('ls -la /var/www/html/pwa-gsp-prod/assets/ | head -15');
  console.log('PWA PROD ASSETS:\\n', r2.stdout);

  ssh.dispose();
}

checkPwaProd().catch(console.error);
