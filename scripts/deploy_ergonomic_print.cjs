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

async function run() {
  console.log('--- CONECTANDO A SERVIDOR PROD ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteProd = '/var/www/html/lg-gsp-prod';

  console.log('Sincronizando frontend optimizado a', remoteProd, '...');
  await ssh.putDirectory(localDist, remoteProd, { recursive: true, concurrency: 10 });
  await ssh.execCommand(`chmod -R 755 ${remoteProd}`);

  console.log('--- VERIFICANDO URL PÚBLICA ---');
  const res = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('HTTP Status https://servidor.leanglobal.cl/lg-gsp-prod/:', res.status);

  ssh.dispose();
  console.log('✓ Despliegue de plantilla ergonómica A4 finalizado con éxito.');
}

run().catch(console.error);
