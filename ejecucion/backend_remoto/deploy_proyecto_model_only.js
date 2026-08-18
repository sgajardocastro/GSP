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
    console.log('Conectado exitosamente como root. Subiendo únicamente proyectoModel.js...');
    
    const localBase = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src';
    const remoteBase = '/home/nodeadmin/proyectos/lean-services-gsp/src';
    
    await ssh.putFile(path.join(localBase, 'models/proyectoModel.js'), remoteBase + '/models/proyectoModel.js');
    
    console.log('Archivo proyectoModel.js subido exitosamente. Reiniciando PM2...');
    const result = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('PM2 STDOUT:', result.stdout);
    if (result.stderr) console.error('PM2 STDERR:', result.stderr);
    
    ssh.dispose();
  } catch (err) {
    console.error('Error durante el despliegue del backend:', err);
    process.exit(1);
  }
}
deploy();
