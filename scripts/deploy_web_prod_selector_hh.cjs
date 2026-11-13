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

async function runDeploy() {
  console.log('--- DESPLEGANDO FRONTEND PROD CON SELECTOR HH DE TÉCNICOS ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('Conectado por SSH.');

  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteWeb = '/var/www/html/lg-gsp-prod';

  console.log(`Sincronizando ${localDist} -> ${remoteWeb}...`);
  const ok = await ssh.putDirectory(localDist, remoteWeb, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });

  if (!ok) throw new Error('Error al sincronizar directorio dist_prod');

  await ssh.execCommand('chmod -R 755 /var/www/html/lg-gsp-prod');
  console.log('Permisos asignados.');

  const check = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`Verificación HTTP PROD: ${check.status}`);

  ssh.dispose();
  console.log('Despliegue finalizado con éxito.');
}

runDeploy().catch(err => {
  console.error('Fallo en despliegue:', err);
  process.exit(1);
});
