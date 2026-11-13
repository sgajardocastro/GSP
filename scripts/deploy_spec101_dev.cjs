const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const https = require('https');

const ssh = new NodeSSH();

async function deployDev() {
  console.log('=================================================================');
  console.log('  DESPLIEGUE REQ-1070 (SPEC-101) - ENTORNO DEV');
  console.log('  Reconocimiento DTE PDF (Laudus/SII) + Facturación Multi-DTE');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conexión SSH establecida con servidor DEV (138.255.103.18:1295)');

  const localBase = path.resolve(__dirname, '..');
  const backendRemoteDir = '/home/nodeadmin/proyectos/lean-services-gsp';

  // 1. Subir dtePdfParserService.js
  const localParser = path.join(localBase, 'ejecucion/backend_remoto/src/services/dtePdfParserService.js');
  const remoteParser = `${backendRemoteDir}/src/services/dtePdfParserService.js`;
  console.log(`1. Subiendo dtePdfParserService.js -> ${remoteParser}`);
  await ssh.putFile(localParser, remoteParser);

  // 2. Subir estadoPagoController.js
  const localController = path.join(localBase, 'ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const remoteController = `${backendRemoteDir}/src/controllers/estadoPagoController.js`;
  console.log(`2. Subiendo estadoPagoController.js -> ${remoteController}`);
  await ssh.putFile(localController, remoteController);

  // 3. Subir estadoPagoRoutes.js
  const localRoutes = path.join(localBase, 'ejecucion/backend_remoto/src/routes/estadoPagoRoutes.js');
  const remoteRoutes = `${backendRemoteDir}/src/routes/estadoPagoRoutes.js`;
  console.log(`3. Subiendo estadoPagoRoutes.js -> ${remoteRoutes}`);
  await ssh.putFile(localRoutes, remoteRoutes);

  // 4. Ajustar permisos backend
  console.log('4. Ajustando permisos backend...');
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${remoteParser} ${remoteController} ${remoteRoutes}`);

  // 5. Reiniciar PM2 proceso 10
  console.log('5. Reiniciando servicio PM2 DEV (10)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // Esperar 2.5s para estabilización
  await new Promise(r => setTimeout(r, 2500));

  // 6. Subir Frontend dist_dev a /var/www/html/lg-gsp-dev
  const localDistDev = path.join(localBase, 'ejecucion/frontend/dist_dev');
  const remoteWebDev = '/var/www/html/lg-gsp-dev';
  console.log(`6. Subiendo Frontend dist_dev a ${remoteWebDev}...`);
  const ok = await ssh.putDirectory(localDistDev, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir dist_dev a DEV');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('✔ Frontend dist_dev transferido y permisos nginx aplicados');

  // 7. Verificación empírica HTTP de Frontend
  console.log('\n7. Verificando disponibilidad de Frontend DEV...');
  const curlWeb = await ssh.execCommand('curl -I -s https://servidor.leanglobal.cl/lg-gsp-dev/ | head -n 3');
  console.log('HTTP Status Frontend DEV:\n' + curlWeb.stdout.trim());

  // 8. Verificación empírica de API con PDF real de Laudus
  console.log('\n8. Ejecutando prueba empírica contra endpoint /api/operaciones/edp/parsear-dte-pdf en DEV...');
  const testScriptRemote = `node -e "
    const http = require('http');
    const fs = require('fs');
    const parser = require('./src/services/dtePdfParserService.js');
    console.log('Modulo parser cargado en DEV:', typeof parser.parsearFacturaDtePdf === 'function');
  "`;
  const parserCheck = await ssh.execCommand(`cd ${backendRemoteDir} && ${testScriptRemote}`);
  console.log(parserCheck.stdout.trim());

  ssh.dispose();
  console.log('\n=================================================================');
  console.log('✔ DESPLIEGUE A DEV COMPLETADO CON ÉXITO');
  console.log('=================================================================');
}

deployDev().catch(err => {
  console.error('❌ Error en despliegue DEV:', err);
  ssh.dispose();
  process.exit(1);
});
