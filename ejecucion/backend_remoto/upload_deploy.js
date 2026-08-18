const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deploy() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 10000
    });
    console.log('Conectado exitosamente como root. Subiendo archivos modificados...');
    
    const localBase = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src';
    const remoteBase = '/home/nodeadmin/proyectos/lean-services-gsp/src';
    
    await ssh.putFile(path.join(localBase, 'models/usuarioModel.js'), remoteBase + '/models/usuarioModel.js');
    await ssh.putFile(path.join(localBase, 'controllers/usuarioController.js'), remoteBase + '/controllers/usuarioController.js');
    await ssh.putFile(path.join(localBase, 'routes/usuarioRoutes.js'), remoteBase + '/routes/usuarioRoutes.js');
    await ssh.putFile(path.join(localBase, 'models/proyectoModel.js'), remoteBase + '/models/proyectoModel.js');
    await ssh.putFile(path.join(localBase, 'models/acreditacionModel.js'), remoteBase + '/models/acreditacionModel.js');
    await ssh.putFile(path.join(localBase, 'controllers/acreditacionController.js'), remoteBase + '/controllers/acreditacionController.js');
    await ssh.putFile(path.join(localBase, 'routes/acreditacionRoutes.js'), remoteBase + '/routes/acreditacionRoutes.js');
    
    console.log('Archivos subidos. Reiniciando PM2...');
    const result = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('PM2 STDOUT:', result.stdout);
    
    ssh.dispose();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
deploy();
