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

async function deploy() {
  console.log('=== INICIANDO DESPLIEGUE: PRODUCCIÓN Y LUEGO DESARROLLO ===\n');
  
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✅ Conexión SSH establecida.');

  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localPwaProd = path.resolve(__dirname, '../ejecucion/pwa/dist_prod');
  const localPwaDev = path.resolve(__dirname, '../ejecucion/pwa/dist_dev');

  // ==========================================
  // FASE 1: PRODUCCIÓN
  // ==========================================
  console.log('\n------------------------------------------------------------');
  console.log('🚀 FASE 1: DESPLEGANDO A PRODUCCIÓN');
  console.log('------------------------------------------------------------');

  console.log('1.1 Subiendo Frontend Web a /var/www/html/lg-gsp-prod...');
  const resFrontendProd = await ssh.putDirectory(localDistProd, '/var/www/html/lg-gsp-prod', {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!resFrontendProd) throw new Error('Error subiendo Frontend PROD');

  console.log('1.2 Subiendo PWA a /var/www/html/pwa-gsp-prod...');
  const resPwaProd = await ssh.putDirectory(localPwaProd, '/var/www/html/pwa-gsp-prod', {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git') && !item.includes('.map')
  });
  if (!resPwaProd) throw new Error('Error subiendo PWA PROD');

  console.log('1.3 Ajustando permisos en PROD (nginx:nginx, 755)...');
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-prod /var/www/html/pwa-gsp-prod && chmod -R 755 /var/www/html/lg-gsp-prod /var/www/html/pwa-gsp-prod');

  // Verificación PROD
  const checkWebProd = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  const checkPwaProd = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log(`Estado HTTP Web PROD: ${checkWebProd.status}`);
  console.log(`Estado HTTP PWA PROD: ${checkPwaProd.status}`);

  // ==========================================
  // FASE 2: DESARROLLO
  // ==========================================
  console.log('\n------------------------------------------------------------');
  console.log('🚀 FASE 2: DESPLEGANDO A DESARROLLO (DEV)');
  console.log('------------------------------------------------------------');

  console.log('2.1 Subiendo Frontend Web a /var/www/html/lg-gsp-dev...');
  const resFrontendDev = await ssh.putDirectory(localDistDev, '/var/www/html/lg-gsp-dev', {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!resFrontendDev) throw new Error('Error subiendo Frontend DEV');

  console.log('2.2 Subiendo PWA a /var/www/html/pwa-gsp-dev...');
  const resPwaDev = await ssh.putDirectory(localPwaDev, '/var/www/html/pwa-gsp-dev', {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git') && !item.includes('.map')
  });
  if (!resPwaDev) throw new Error('Error subiendo PWA DEV');

  console.log('2.3 Ajustando permisos en DEV (nginx:nginx, 755)...');
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev /var/www/html/pwa-gsp-dev && chmod -R 755 /var/www/html/lg-gsp-dev /var/www/html/pwa-gsp-dev');

  // Verificación DEV
  const checkWebDev = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkPwaDev = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log(`Estado HTTP Web DEV: ${checkWebDev.status}`);
  console.log(`Estado HTTP PWA DEV: ${checkPwaDev.status}`);

  // Verificación de existencia de las reglas CSS en el servidor
  console.log('\n------------------------------------------------------------');
  console.log('🔍 VERIFICACIÓN DE REGLAS CSS DESPLEGADAS EN SERVIDOR');
  console.log('------------------------------------------------------------');
  const cssCheckProd = await ssh.execCommand('grep -o "webkit-calendar-picker-indicator" /var/www/html/lg-gsp-prod/assets/*.css | head -n 1');
  console.log('CSS en Web PROD:', cssCheckProd.stdout.trim() ? 'PRESENTE ✅' : 'NO DETECTADO ❌');

  const cssCheckDev = await ssh.execCommand('grep -o "webkit-calendar-picker-indicator" /var/www/html/lg-gsp-dev/assets/*.css | head -n 1');
  console.log('CSS en Web DEV:', cssCheckDev.stdout.trim() ? 'PRESENTE ✅' : 'NO DETECTADO ❌');

  ssh.dispose();
  console.log('\n🎉 DESPLIEGUE A PRODUCCIÓN Y DESARROLLO FINALIZADO CON ÉXITO.');
}

deploy().catch(err => {
  console.error('Error durante el despliegue:', err);
  process.exit(1);
});
