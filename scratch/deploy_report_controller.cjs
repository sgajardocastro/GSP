const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  console.log("Conectando al servidor DEV para desplegar reportDiarioController.js...");
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  console.log("Conexión SSH establecida.");

  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/reportDiarioController.js');
  const remoteController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js';
  console.log(`Subiendo: ${localController} -> ${remoteController}...`);
  await ssh.putFile(localController, remoteController);
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js');

  console.log("Reiniciando PM2 proceso 10 (lean-services-gsp)...");
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log("PM2 Output:\n", pm2Res.stdout || pm2Res.stderr);

  ssh.dispose();
  console.log("Despliegue y reinicio completado exitosamente.");
}

run().catch((err) => {
  console.error("Error en despliegue:", err);
  process.exit(1);
});
