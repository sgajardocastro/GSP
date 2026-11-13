const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncDev() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  await ssh.putFile(
    'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/controllers/controlVivoController.js',
    '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/controlVivoController.js'
  );
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('✅ DEV Backend PM2 ID 10 sincronizado y reiniciado con éxito.');
  ssh.dispose();
}

syncDev().catch(console.error);
