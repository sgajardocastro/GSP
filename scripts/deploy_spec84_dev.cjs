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

async function deploySpec84() {
  console.log('========================================================================');
  console.log('DESPLIEGUE A DEV: FRONTEND WEB & PWA OPERADOR (SPEC-084)');
  console.log('========================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 30000
  });
  console.log('✅ Conectado exitosamente por SSH como root.\n');

  // 1. DESPLIEGUE FRONTEND WEB DEV
  console.log('--- 1. SUBIENDO FRONTEND WEB A DEV (/var/www/html/lg-gsp-dev) ---');
  const localWebDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const remoteWebDev = '/var/www/html/lg-gsp-dev';
  console.log(`Subiendo archivos desde ${localWebDist} a ${remoteWebDev}...`);
  const statusWeb = await ssh.putDirectory(localWebDist, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map') && !itemPath.includes('.git')
  });
  if (!statusWeb) throw new Error('Fallo al transferir Frontend Web a DEV');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('✅ Frontend Web desplegado exitosamente en DEV.\n');

  // 2. DESPLIEGUE PWA OPERADOR DEV
  console.log('--- 2. SUBIENDO PWA OPERADOR A DEV (/var/www/html/pwa-gsp-dev) ---');
  const localPwaDist = path.resolve(__dirname, '../ejecucion/pwa/dist');
  const remotePwaDev = '/var/www/html/pwa-gsp-dev';
  console.log(`Subiendo archivos desde ${localPwaDist} a ${remotePwaDev}...`);
  const statusPwa = await ssh.putDirectory(localPwaDist, remotePwaDev, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map') && !itemPath.includes('.git')
  });
  if (!statusPwa) throw new Error('Fallo al transferir PWA a DEV');
  await ssh.execCommand(`chown -R nginx:nginx ${remotePwaDev} && chmod -R 755 ${remotePwaDev}`);
  console.log('✅ PWA Operador desplegada exitosamente en DEV.\n');

  // 3. VERIFICACIÓN EMPÍRICA DE ENDPOINTS DEV
  console.log('--- 3. VERIFICACIÓN DE ESTADO HTTP EN VIVO ---');
  const resWeb = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('HTTP Status Portal Web DEV:', resWeb.status);

  const resPwa = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log('HTTP Status PWA Operador DEV:', resPwa.status);

  ssh.dispose();
  console.log('\n🎉 DESPLIEGUE SPEC-084 EN DEV COMPLETADO EXITOSAMENTE.');
}

deploySpec84().catch(err => {
  console.error('❌ Error durante el despliegue a DEV:', err);
  process.exit(1);
});
