const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkPwaProdJs() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('grep -rn "comprimirImagenABlob" /var/www/html/pwa-gsp-prod/js/ || grep -rn "pwaStorageHelper" /var/www/html/pwa-gsp-prod/js/');
  console.log('SEARCH PROD PWA:\n', res.stdout ? 'ENCONTRADO EN PROD!' : 'NO ENCONTRADO EN PROD');

  const resDev = await ssh.execCommand('grep -rn "comprimirImagenABlob" /var/www/html/pwa-gsp-dev/js/ || grep -rn "pwaStorageHelper" /var/www/html/pwa-gsp-dev/js/');
  console.log('SEARCH DEV PWA:\n', resDev.stdout ? 'ENCONTRADO EN DEV!' : 'NO ENCONTRADO EN DEV');

  ssh.dispose();
}

checkPwaProdJs().catch(console.error);
