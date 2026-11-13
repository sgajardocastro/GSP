const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const localPdfService = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js');

  console.log('1. Subiendo archivos a DEV...');
  await ssh.putFile(localController, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js');
  await ssh.putFile(localPdfService, '/home/nodeadmin/proyectos/lean-services-gsp/src/services/itsPdfService.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js /home/nodeadmin/proyectos/lean-services-gsp/src/services/itsPdfService.js');

  console.log('2. Subiendo archivos a PROD...');
  await ssh.putFile(localController, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js');
  await ssh.putFile(localPdfService, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/itsPdfService.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js /home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/itsPdfService.js');

  console.log('3. Reiniciando PM2 DEV (ID 10) y PROD (ID 13)...');
  const pm2Dev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('DEV:', pm2Dev.stdout.split('\n').find(l => l.includes('10')) || pm2Dev.stdout);

  const pm2Prod = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PROD:', pm2Prod.stdout.split('\n').find(l => l.includes('13')) || pm2Prod.stdout);

  ssh.dispose();
  console.log('✅ Despliegue completado con éxito.');
}

main().catch(console.error);
