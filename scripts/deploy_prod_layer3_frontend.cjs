const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function runLayer3() {
  console.log('=== CAPA 3: DESPLIEGUE FRONTEND WEB A PRODUCCION (/var/www/html/lg-gsp-prod) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteProd = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo Frontend PROD desde ${localDistProd} a ${remoteProd}...`);
  const ok = await ssh.putDirectory(localDistProd, remoteProd, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir archivos a PROD');

  console.log('Ajustando permisos nginx:nginx y 755 en PROD...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProd} && chmod -R 755 ${remoteProd}`);

  console.log('\n--- VERIFICACIÓN HTTP EN VIVO EN PRODUCCIÓN ---');
  const prodCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('HTTP Status Web PROD:', prodCheck.status);

  const apiCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/api/inventario/traspasos');
  console.log('HTTP Status API Traspasos PROD:', apiCheck.status);

  const prodIndex = await ssh.execCommand(`head -n 25 ${remoteProd}/index.html`);
  console.log('\nPROD index.html tags:');
  console.log(prodIndex.stdout.split('\n').filter(l => l.includes('script') || l.includes('link') || l.includes('title')).join('\n'));

  ssh.dispose();
  console.log('\n🎉 CAPA 3 (FRONTEND WEB PRODUCCIÓN) DESPLEGADA EXITOSAMENTE.');
}

runLayer3().catch(err => {
  console.error('Error fatal en Capa 3:', err);
  process.exit(1);
});
