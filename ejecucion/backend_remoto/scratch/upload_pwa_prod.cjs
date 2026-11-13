const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployPwaProd() {
  console.log('==================================================================');
  console.log('🚀 SUBIENDO PWA A PRODUCCIÓN (/var/www/html/pwa-gsp-prod)...');
  console.log('==================================================================');

  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log('✅ Conectado exitosamente como root.');

    const localDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/pwa/dist';
    const remoteDir = '/var/www/html/pwa-gsp-prod';

    // Respaldar antes de limpiar
    await ssh.execCommand(`mkdir -p /var/www/html/backups && tar -czf /var/www/html/backups/pwa-gsp-prod-before-fix.tar.gz -C /var/www/html pwa-gsp-prod 2>/dev/null`);

    console.log(`Subiendo archivos desde ${localDir} a ${remoteDir}...`);
    await ssh.putDirectory(localDir, remoteDir, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });

    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} && chmod -R 755 ${remoteDir}`);
    console.log('✅ PWA desplegado exitosamente en ' + remoteDir);

    // Verificar que index.html y js referencien lg-gsp-prod
    const indexCheck = await ssh.execCommand(`grep -o "/pwa-gsp-prod/[^\"]*" ${remoteDir}/index.html | head -n 5`);
    console.log('Verificación index.html paths:\n', indexCheck.stdout);

    const apiCheck = await ssh.execCommand(`grep -o "lg-gsp-prod/api" ${remoteDir}/js/app.*.js | head -n 3`);
    console.log('Verificación API endpoint en bundle:\n', apiCheck.stdout);

  } catch (err) {
    console.error('❌ Error durante el despliegue del PWA:', err);
  } finally {
    ssh.dispose();
  }
}

deployPwaProd();
