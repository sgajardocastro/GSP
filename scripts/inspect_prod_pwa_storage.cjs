const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectProdPwaStorage() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('grep -rn "subirFotoAStorage" /var/www/html/pwa-gsp-prod/js/');
  console.log('subirFotoAStorage in prod:\n', res.stdout);

  ssh.dispose();
}

inspectProdPwaStorage().catch(console.error);
