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

async function deploy() {
  console.log('========================================================================');
  console.log('🚀 DESPLIEGUE REQ-1038 / SPEC-073: PWA REDISEÑO, SSO & BACKEND CONCURRENCIA');
  console.log('========================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('✅ Conectado como root por SSH.\n');

  const baseLocalBackend = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/mantenimientoModel.js');

  // 1. DESPLIEGUE BACKEND DEV Y PROD
  console.log('--- 1. DESPLEGANDO BACKEND MODEL A DEV Y PROD ---');
  const devModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/mantenimientoModel.js';
  const prodModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/mantenimientoModel.js';

  console.log(`Subiendo mantenimientoModel.js -> DEV (${devModel})...`);
  await ssh.putFile(baseLocalBackend, devModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devModel}`);

  console.log(`Subiendo mantenimientoModel.js -> PROD (${prodModel})...`);
  await ssh.putFile(baseLocalBackend, prodModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodModel}`);

  console.log('\nReiniciando PM2 DEV (10) y PROD (13)...');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 DEV (10):', restartDev.stdout.trim() || restartDev.stderr.trim());

  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 PROD (13):', restartProd.stdout.trim() || restartProd.stderr.trim());

  // 2. DESPLIEGUE PWA PRODUCCIÓN
  console.log('\n--- 2. DESPLEGANDO PWA A PRODUCCIÓN (/var/www/html/pwa-gsp-prod) ---');
  const localDist = path.resolve(__dirname, '../ejecucion/pwa/dist');
  const remotePwaProd = '/var/www/html/pwa-gsp-prod';

  console.log(`Subiendo bundle desde ${localDist} a ${remotePwaProd}...`);
  await ssh.putDirectory(localDist, remotePwaProd, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  await ssh.execCommand(`chown -R nginx:nginx ${remotePwaProd} && chmod -R 755 ${remotePwaProd}`);
  console.log('✅ PWA desplegado en Producción.');

  // 3. VERIFICACIONES REMOTAS
  console.log('\n--- 3. VERIFICACIÓN DETERMINISTA ---');
  const indexCheck = await ssh.execCommand(`grep -o "/pwa-gsp-prod/[^\"]*" ${remotePwaProd}/index.html | head -n 4`);
  console.log('Index.html assets en PROD:\n', indexCheck.stdout.trim());

  const statusDev = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log(`HTTP DEV PWA: ${statusDev.status}`);

  const statusProd = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log(`HTTP PROD PWA: ${statusProd.status}`);

  // Test endpoint backend PROD
  const testProdKpi = await ssh.execCommand('curl -s "http://127.0.0.1:3007/api/mantenimiento/kpis?_bypass_empresa=1"');
  console.log('Test Backend PROD (3007) /api/mantenimiento/kpis:', testProdKpi.stdout.substring(0, 100));

  ssh.dispose();
  console.log('\n🎉 Despliegue completado exitosamente.');
}

deploy().catch((err) => {
  console.error('❌ Error en despliegue:', err);
  process.exit(1);
});
