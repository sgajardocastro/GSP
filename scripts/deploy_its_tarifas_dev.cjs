const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function deployDev() {
  console.log('=================================================================');
  console.log('  DESPLIEGUE A DEV: INTEGRACIÓN TARIFAS OPERADOR ITS (SPEC-078)');
  console.log('  Y RECONOCIMIENTO VALIDADO DTE (SPEC-101)');
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

  // 1. Subir tarifasOperadorService.js
  const localTarifas = path.join(localBase, 'ejecucion/backend_remoto/src/services/tarifasOperadorService.js');
  const remoteTarifas = `${backendRemoteDir}/src/services/tarifasOperadorService.js`;
  console.log(`1. Subiendo tarifasOperadorService.js -> ${remoteTarifas}`);
  await ssh.putFile(localTarifas, remoteTarifas);

  // 2. Subir itsController.js
  const localIts = path.join(localBase, 'ejecucion/backend_remoto/src/controllers/itsController.js');
  const remoteIts = `${backendRemoteDir}/src/controllers/itsController.js`;
  console.log(`2. Subiendo itsController.js -> ${remoteIts}`);
  await ssh.putFile(localIts, remoteIts);

  // 3. Subir dtePdfParserService.js
  const localParser = path.join(localBase, 'ejecucion/backend_remoto/src/services/dtePdfParserService.js');
  const remoteParser = `${backendRemoteDir}/src/services/dtePdfParserService.js`;
  console.log(`3. Subiendo dtePdfParserService.js -> ${remoteParser}`);
  await ssh.putFile(localParser, remoteParser);

  // 4. Subir estadoPagoController.js
  const localEdpController = path.join(localBase, 'ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const remoteEdpController = `${backendRemoteDir}/src/controllers/estadoPagoController.js`;
  console.log(`4. Subiendo estadoPagoController.js -> ${remoteEdpController}`);
  await ssh.putFile(localEdpController, remoteEdpController);

  // 5. Subir estadoPagoRoutes.js
  const localRoutes = path.join(localBase, 'ejecucion/backend_remoto/src/routes/estadoPagoRoutes.js');
  const remoteRoutes = `${backendRemoteDir}/src/routes/estadoPagoRoutes.js`;
  console.log(`5. Subiendo estadoPagoRoutes.js -> ${remoteRoutes}`);
  await ssh.putFile(localRoutes, remoteRoutes);

  // 6. Ajustar permisos backend
  console.log('6. Ajustando permisos backend...');
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${remoteTarifas} ${remoteIts} ${remoteParser} ${remoteEdpController} ${remoteRoutes}`);

  // 7. Reiniciar PM2 proceso 10
  console.log('7. Reiniciando servicio PM2 DEV (ID 10)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // Esperar 2.5s para estabilización
  await new Promise(r => setTimeout(r, 2500));

  // 8. Subir Frontend dist_dev a /var/www/html/lg-gsp-dev
  const localDistDev = path.join(localBase, 'ejecucion/frontend/dist_dev');
  const remoteWebDev = '/var/www/html/lg-gsp-dev';
  console.log(`8. Subiendo Frontend dist_dev a ${remoteWebDev}...`);
  const ok = await ssh.putDirectory(localDistDev, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir dist_dev a DEV');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('✔ Frontend dist_dev transferido y permisos nginx aplicados');

  // 9. Verificación empírica HTTP de Frontend
  console.log('\n9. Verificando disponibilidad de Frontend DEV...');
  const curlWeb = await ssh.execCommand('curl -I -s https://servidor.leanglobal.cl/lg-gsp-dev/ | head -n 3');
  console.log('HTTP Status Frontend DEV:\n' + curlWeb.stdout.trim());

  // 10. Verificación empírica de tarifas en el backend DEV
  console.log('\n10. Verificando módulo tarifasOperadorService en DEV...');
  const testScriptRemote = `node -e "
    const svc = require('./src/services/tarifasOperadorService.js');
    console.log('Tarifa Grúa 70 TON:', svc.resolverTarifaOperador('GRUAS TELESCOPICAS', 70));
    console.log('Tarifa Camión Pluma:', svc.resolverTarifaOperador('CAMION PLUMA', 0));
    console.log('Tarifa Traslado Grúa 70 TON:', svc.resolverTarifaTraslado('GRUAS TELESCOPICAS', 70));
  "`;
  const tarifasCheck = await ssh.execCommand(`cd ${backendRemoteDir} && ${testScriptRemote}`);
  console.log(tarifasCheck.stdout.trim());

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
