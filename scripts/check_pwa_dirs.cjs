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

  const res = await ssh.execCommand('ls -la /var/www/html/pwa-gsp-prod/');
  console.log('PWA PROD:\n', res.stdout);

  const resDev = await ssh.execCommand('ls -la /var/www/html/pwa-gsp-dev/');
  console.log('PWA DEV:\n', resDev.stdout);

  ssh.dispose();
}

checkPwaProd().catch(console.error);
