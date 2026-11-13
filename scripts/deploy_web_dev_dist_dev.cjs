const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function deployWebDev() {
  console.log('=== DESPLEGANDO DIST_DEV A WEB DEV (/var/www/html/lg-gsp-dev) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const remoteDev = '/var/www/html/lg-gsp-dev';

  console.log(`Subiendo Frontend DEV desde ${localDist} a ${remoteDev}...`);
  const ok = await ssh.putDirectory(localDist, remoteDev, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir archivos a DEV');

  console.log('Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDev} && chmod -R 755 ${remoteDev}`);

  const httpRes = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('HTTP Status Web DEV:', httpRes.status);

  ssh.dispose();
  console.log('\n🎉 WEB DESARROLLO DESPLEGADA EXITOSAMENTE.');
}

deployWebDev().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
