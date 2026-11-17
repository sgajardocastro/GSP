const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const checkIndex = await ssh.execCommand('grep -c "/pwa-gsp-prod/" /var/www/html/pwa-gsp-dev/index.html');
  console.log("Ocurrencias en index.html:", checkIndex.stdout.trim());

  const checkJs = await ssh.execCommand('grep -l "/pwa-gsp-prod/" /var/www/html/pwa-gsp-dev/js/*.js');
  console.log("Archivos JS con /pwa-gsp-prod/:", checkJs.stdout.trim());

  ssh.dispose();
}

main().catch(console.error);
