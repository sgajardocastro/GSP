const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deployModel() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });
  console.log('✅ Conectado por SSH.');

  const localFile = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/models/proyectoModel.js';
  
  // 1. DEV
  console.log('Subiendo proyectoModel.js a DEV...');
  await ssh.putFile(localFile, '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js');

  // 2. PROD
  console.log('Subiendo proyectoModel.js a PROD...');
  await ssh.putFile(localFile, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js');

  // 3. Reiniciar PM2 procesos
  console.log('Reiniciando PM2 DEV (10) y PROD (13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');

  const status = await ssh.execCommand('su - nodeadmin -c "pm2 status 10 13"');
  console.log(status.stdout);

  ssh.dispose();
  console.log('✅ Despliegue de Backend completado.');
}

deployModel().catch(console.error);
