const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployPwaProd() {
  console.log('==================================================================');
  console.log('🚀 SUBIENDO PWA CORREGIDA A PRODUCCIÓN (/var/www/html/pwa-gsp-prod)...');
  console.log('==================================================================\n');

  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log('✅ Conectado exitosamente como root al servidor.');

    const localDir = path.resolve(__dirname, '../ejecucion/pwa/dist');
    const remoteDir = '/var/www/html/pwa-gsp-prod';

    // Respaldar antes de actualizar
    console.log('Creando respaldo preventivo en el servidor...');
    await ssh.execCommand('mkdir -p /var/www/html/backups && tar -czf /var/www/html/backups/pwa-gsp-prod-before-button-fix.tar.gz -C /var/www/html pwa-gsp-prod 2>/dev/null');

    console.log(`Subiendo archivos desde ${localDir} hacia ${remoteDir}...`);
    await ssh.putDirectory(localDir, remoteDir, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });

    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} && chmod -R 755 ${remoteDir}`);
    console.log('✅ Permisos nginx asignados exitosamente.');

    // Verificar despliegue
    const indexCheck = await ssh.execCommand(`head -n 10 ${remoteDir}/index.html`);
    console.log('Verificación index.html:\n', indexCheck.stdout);

    console.log('\n🎉 Despliegue PWA en producción concluido exitosamente.');
  } catch (err) {
    console.error('❌ Error durante el despliegue del PWA:', err);
  } finally {
    ssh.dispose();
  }
}

deployPwaProd();
