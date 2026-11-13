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

async function deployWebProd() {
  console.log('=== DESPLEGANDO PRIORITARIAMENTE A WEB PRODUCCIÓN (/var/www/html/lg-gsp-prod) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✅ Conexión SSH establecida.');

  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist');
  const remoteProd = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo Frontend PROD desde ${localDist} a ${remoteProd}...`);
  const ok = await ssh.putDirectory(localDist, remoteProd, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir archivos a PROD');

  console.log('Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProd} && chmod -R 755 ${remoteProd}`);

  // Verificar index.html
  const headIndex = await ssh.execCommand(`head -n 25 ${remoteProd}/index.html`);
  console.log('\n--- index.html en servidor PROD ---');
  console.log(headIndex.stdout);

  // Verificar respuesta HTTP
  const httpRes = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('HTTP Status Web PROD:', httpRes.status);

  // Verificar CSS nuevo en servidor
  const cssCheck = await ssh.execCommand(`grep -o "filter:none" ${remoteProd}/assets/*.css | head -n 1`);
  console.log('Regla filter:none en PROD:', cssCheck.stdout.trim() ? 'PRESENTE Y CONFIRMADA ✅' : 'NO DETECTADA ❌');

  ssh.dispose();
  console.log('\n🎉 WEB PRODUCCIÓN DESPLEGADA EXITOSAMENTE.');
}

deployWebProd().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
