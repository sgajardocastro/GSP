const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployPwa() {
  try {
    console.log('Conectando por SSH a servidor DEV...');
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: process.env.SSH_PASSWORD || 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log('Conexión establecida. Subiendo PWA dev...');
    
    const localDir = path.resolve(__dirname, '../ejecucion/pwa/dist');
    const remoteDir = '/var/www/html/pwa-gsp-dev';
    
    await ssh.putDirectory(localDir, remoteDir, {
      recursive: true,
      concurrency: 10
    });
    
    console.log('Ajustando permisos en ' + remoteDir + '...');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} && chmod -R 755 ${remoteDir}`);
    
    const checkIndex = await ssh.execCommand(`head -n 2 ${remoteDir}/index.html`);
    console.log('Contenido inicial de index.html remoto:\n', checkIndex.stdout);
    
    console.log('✅ PWA DEV desplegado y verificado exitosamente.');
  } catch (err) {
    console.error('Error durante el despliegue del PWA DEV:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

deployPwa();
