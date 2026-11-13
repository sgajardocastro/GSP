const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function patchController() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('1. Subiendo reportDiarioController.js corregido a DEV...');
  const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/reportDiarioController.js');
  const remoteFile = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js';

  await ssh.putFile(localFile, remoteFile);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteFile} && chmod 644 ${remoteFile}`);
  console.log('✅ Archivo subido y permisos aplicados.');

  console.log('2. Reiniciando PM2 DEV (ID 10)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout.split('\n')[0]);

  ssh.dispose();
}

patchController().catch(console.error);
