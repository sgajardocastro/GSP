const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployFrontend() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 10000
    });
    console.log('Conectado exitosamente como root. Subiendo frontend...');
    
    const localDir = path.join(__dirname, 'dist');
    const remoteDir = '/var/www/html/lg-gsp-dev';
    
    await ssh.putDirectory(localDir, remoteDir, {
      recursive: true,
      concurrency: 10
    });
    
    console.log('Frontend subido exitosamente a ' + remoteDir);
  } catch (err) {
    console.error('Error durante el despliegue del frontend:', err);
  } finally {
    ssh.dispose();
  }
}

deployFrontend();
