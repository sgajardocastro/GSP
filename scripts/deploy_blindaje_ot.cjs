const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployFix() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';

  const localService = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/motorValorizacionService.js');
  const remoteService = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/motorValorizacionService.js';

  console.log(`Subiendo ${localService} a ${remoteService}...`);
  await ssh.putFile(localService, remoteService);

  console.log(`Subiendo ${localModel} a ${remoteModel}...`);
  await ssh.putFile(localModel, remoteModel);

  console.log('Reiniciando PM2 ID 13 (lean-services-gsp-prod)...');
  const res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(res.stdout);

  ssh.dispose();
  console.log('Despliegue completado exitosamente.');
}

deployFix().catch(console.error);
