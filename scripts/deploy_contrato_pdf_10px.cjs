const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deploy() {
  console.log('=== Despliegue de proyectoModel.js (Contrato 10px) a DEV ===');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida.');

  const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const remoteDev = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';

  console.log('Subiendo proyectoModel.js a DEV...');
  await ssh.putFile(localFile, remoteDev);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteDev}`);

  console.log('Reiniciando PM2 proceso 10 (DEV)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 restart output:', pm2Res.stdout || pm2Res.stderr);

  ssh.dispose();
  console.log('=== Despliegue finalizado exitosamente ===');
}

deploy().catch(err => {
  console.error('Error en despliegue:', err);
  process.exit(1);
});
