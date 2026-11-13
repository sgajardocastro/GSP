const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployPwaDev() {
  console.log('==================================================================');
  console.log('🚀 SUBIENDO PWA CORREGIDA A DEV (/var/www/html/pwa-gsp-dev)...');
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
    const remoteDir = '/var/www/html/pwa-gsp-dev';

    console.log(`Subiendo archivos desde ${localDir} hacia ${remoteDir}...`);
    await ssh.putDirectory(localDir, remoteDir, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });

    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} && chmod -R 755 ${remoteDir}`);
    console.log('✅ Permisos nginx asignados exitosamente.');

    // Verificar despliegue
    const indexCheck = await ssh.execCommand(`head -n 5 ${remoteDir}/index.html`);
    console.log('Verificación index.html:\n', indexCheck.stdout);

    const res = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
    console.log('HTTP Status DEV:', res.stdout.trim());

    console.log('\n🎉 Despliegue PWA en DEV concluido exitosamente.');
  } catch (err) {
    console.error('❌ Error durante el despliegue del PWA DEV:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

deployPwaDev();
