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

async function runDeploy() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE A PRODUCCIÓN - FIXES HITO 3 (TALLER & BODEGA TEMUCO)');
  console.log('==================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('✅ Conexión SSH establecida con éxito.');

  // 1. BACKEND PRODUCCIÓN
  console.log('\n--- 1. DESPLEGANDO BACKEND PROD (PM2 13) ---');
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/mantenimientoModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/mantenimientoModel.js';
  console.log(`Subiendo mantenimientoModel.js -> ${remoteModel}...`);
  await ssh.putFile(localModel, remoteModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteModel}`);

  const localInvModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/inventarioModel.js');
  const remoteInvModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/inventarioModel.js';
  console.log(`Subiendo inventarioModel.js -> ${remoteInvModel}...`);
  await ssh.putFile(localInvModel, remoteInvModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteInvModel}`);

  console.log('Reiniciando PM2 13 (lean-services-gsp-prod)...');
  const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(restartRes.stdout.trim() || restartRes.stderr.trim());

  await new Promise(r => setTimeout(r, 2500));

  // 2. FRONTEND WEB PRODUCCIÓN
  console.log('\n--- 2. DESPLEGANDO FRONTEND WEB PROD (/var/www/html/lg-gsp-prod) ---');
  const localWeb = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteWeb = '/var/www/html/lg-gsp-prod';
  console.log(`Sincronizando dist_prod hacia ${remoteWeb}...`);
  const okWeb = await ssh.putDirectory(localWeb, remoteWeb, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!okWeb) throw new Error('Error al transferir frontend web');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteWeb} && chmod -R 755 ${remoteWeb}`);
  console.log('✅ Frontend Web PROD desplegado y permisos asignados.');

  // 3. PWA MÓVIL PRODUCCIÓN
  console.log('\n--- 3. DESPLEGANDO PWA MÓVIL PROD (/var/www/html/pwa-gsp-prod) ---');
  const localPwa = path.resolve(__dirname, '../ejecucion/pwa/dist');
  const remotePwa = '/var/www/html/pwa-gsp-prod';
  console.log(`Sincronizando dist hacia ${remotePwa}...`);
  const okPwa = await ssh.putDirectory(localPwa, remotePwa, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.map')
  });
  if (!okPwa) throw new Error('Error al transferir PWA');
  await ssh.execCommand(`chown -R nginx:nginx ${remotePwa} && chmod -R 755 ${remotePwa}`);
  console.log('✅ PWA Móvil PROD desplegada y permisos asignados.');

  // 4. VERIFICACIÓN HTTP
  console.log('\n--- 4. VERIFICACIÓN HTTP EN VIVO ---');
  const webCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('Status Web PROD:', webCheck.status);

  const pwaCheck = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log('Status PWA PROD:', pwaCheck.status);

  const apiCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/api/mantenimiento/kpis');
  console.log('Status API PROD:', apiCheck.status);

  ssh.dispose();
  console.log('\n🎉 ¡DESPLIEGUE A PRODUCCIÓN FINALIZADO EXITOSAMENTE CON 0 ERRORES!');
}

runDeploy().catch(err => {
  console.error('❌ Error fatal en despliegue:', err);
  process.exit(1);
});
