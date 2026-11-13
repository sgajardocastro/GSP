const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function syncBackendReq993() {
  console.log('🔌 Conectando SSH para sincronizar reportDiarioController.js en DEV y PROD...');
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  console.log('✅ SSH Conectado.');

  const localFile = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/controllers/reportDiarioController.js';

  // 1. Sincronizar DEV
  console.log('⬆️ Subiendo a DEV (/home/nodeadmin/proyectos/lean-services-gsp)...');
  await ssh.putFile(localFile, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js');
  const resDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('DEV PM2 reload:\n', resDev.stdout);

  // 2. Sincronizar PROD
  console.log('⬆️ Subiendo a PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod)...');
  await ssh.putFile(localFile, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js');
  const resProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PROD PM2 reload:\n', resProd.stdout);

  ssh.dispose();
  console.log('✅ Backend actualizado y reiniciado exitosamente en DEV y PROD.');
}

syncBackendReq993().catch(console.error);
