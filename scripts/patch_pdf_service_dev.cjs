const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function patchPdfService() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('1. Subiendo actaPlataformaPdfService.js homologado...');
  const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/actaPlataformaPdfService.js');
  const remoteFile = '/home/nodeadmin/proyectos/lean-services-gsp/src/services/actaPlataformaPdfService.js';

  await ssh.putFile(localFile, remoteFile);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteFile} && chmod 644 ${remoteFile}`);
  console.log('✅ Archivo subido y permisos aplicados.');

  console.log('2. Reiniciando PM2 DEV (ID 10)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout.split('\n')[0]);

  ssh.dispose();
}

patchPdfService().catch(console.error);
