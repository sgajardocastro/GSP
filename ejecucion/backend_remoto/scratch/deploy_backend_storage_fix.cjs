const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  const root = 'D:\\SGajardo\\Google Drive\\Antigravity\\Grúas San Pablo\\Propuesta Gestión Operación Grúas\\ejecucion\\backend_remoto';
  
  const storageConfigLocal = path.join(root, 'src', 'config', 'storageConfig.js');
  const proyectoModelLocal = path.join(root, 'src', 'models', 'proyectoModel.js');

  console.log('=== SUBIENDO ARCHIVOS A PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod) ===');
  await ssh.putFile(storageConfigLocal, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/storageConfig.js');
  await ssh.putFile(proyectoModelLocal, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/');

  console.log('=== SUBIENDO ARCHIVOS A DEV (/home/nodeadmin/proyectos/lean-services-gsp) ===');
  await ssh.putFile(storageConfigLocal, '/home/nodeadmin/proyectos/lean-services-gsp/src/config/storageConfig.js');
  await ssh.putFile(proyectoModelLocal, '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/');

  console.log('=== REINICIANDO PROCESOS PM2 ===');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart lean-services-gsp-prod && pm2 restart lean-services-gsp"');
  console.log(pm2Res.stdout);

  ssh.dispose();
  console.log('=== DEPLOY BACKEND COMPLETADO ===');
}

run().catch(console.error);
