const path = require('path');
const fs = require('fs');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  console.log("Conectando al servidor DEV...");
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  console.log("Conexión SSH establecida.");

  // 1. Despliegue Backend: proyectoModel.js
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';
  console.log(`Subiendo backend: ${localModel} -> ${remoteModel}...`);
  await ssh.putFile(localModel, remoteModel);
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js');

  // 2. Reinicio PM2 10
  console.log("Reiniciando PM2 proceso 10 (lean-services-gsp)...");
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log("PM2 Output:\n", pm2Res.stdout);

  // 3. Despliegue Frontend: dist_dev -> /var/www/html/lg-gsp-dev/
  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  console.log(`Subiendo frontend compilado desde ${localDist} a /var/www/html/lg-gsp-dev/...`);
  await ssh.putDirectory(localDist, '/var/www/html/lg-gsp-dev', {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.endsWith('.map')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev/ && chmod -R 755 /var/www/html/lg-gsp-dev/');

  console.log("Despliegue integral a DEV completado con éxito.");
  ssh.dispose();
}

run().catch((err) => {
  console.error("Error en despliegue:", err);
  process.exit(1);
});
