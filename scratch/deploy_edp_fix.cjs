const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  console.log("Conectando al servidor DEV para desplegar fixes autorizados...");
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  console.log("Conexión SSH establecida.");

  // 1. Despliegue lineaCobroUnico.js
  const localUtils = path.resolve(__dirname, '../ejecucion/backend_remoto/src/utils/lineaCobroUnico.js');
  const remoteUtils = '/home/nodeadmin/proyectos/lean-services-gsp/src/utils/lineaCobroUnico.js';
  console.log(`Subiendo: ${localUtils} -> ${remoteUtils}...`);
  await ssh.putFile(localUtils, remoteUtils);
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/utils/lineaCobroUnico.js');

  // 2. Despliegue estadoPagoController.js
  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const remoteController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/estadoPagoController.js';
  console.log(`Subiendo: ${localController} -> ${remoteController}...`);
  await ssh.putFile(localController, remoteController);
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/estadoPagoController.js');

  // 3. Reinicio PM2 10
  console.log("Reiniciando PM2 proceso 10 (lean-services-gsp)...");
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log("PM2 Output:\n", pm2Res.stdout || pm2Res.stderr);

  // 4. Verificar status
  const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 show 10"');
  console.log("PM2 Status (extract):\n", pm2Status.stdout.split('\n').slice(0, 15).join('\n'));

  ssh.dispose();
  console.log("Despliegue y reinicio completado exitosamente.");
}

run().catch((err) => {
  console.error("Error en despliegue:", err);
  process.exit(1);
});
