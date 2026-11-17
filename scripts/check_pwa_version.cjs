const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkPwaProdVersion() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('grep -o "v1.0.[0-9]*" /var/www/html/pwa-gsp-prod/js/*.js | head -n 10');
  console.log('VERSIONS IN PROD PWA:\n', res.stdout);

  ssh.dispose();
}

checkPwaProdVersion().catch(console.error);
