const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

async function main() {
  const ssh = new NodeSSH();
  console.log('🔌 Conectando por SSH a 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✅ Conexión SSH establecida con éxito.');

  const rootDir = path.resolve(__dirname, '..');
  const webDist = path.join(rootDir, 'ejecucion', 'frontend', 'dist_dev');
  const pwaDist = path.join(rootDir, 'ejecucion', 'pwa', 'dist');

  // 1. Subir Frontend Web a /var/www/html/lg-gsp-dev
  const webRemote = '/var/www/html/lg-gsp-dev';
  console.log(`\n⬆️ 1. Subiendo Frontend Web DEV (${webDist} -> ${webRemote})...`);
  await ssh.putDirectory(webDist, webRemote, {
    recursive: true,
    concurrency: 15
  });
  await ssh.execCommand(`chown -R nginx:nginx ${webRemote} && chmod -R 755 ${webRemote}`);
  console.log('✅ Frontend Web subido exitosamente.');

  // 2. Subir PWA a /var/www/html/pwa-gsp-dev
  const pwaRemote = '/var/www/html/pwa-gsp-dev';
  console.log(`\n⬆️ 2. Subiendo PWA DEV (${pwaDist} -> ${pwaRemote})...`);
  await ssh.putDirectory(pwaDist, pwaRemote, {
    recursive: true,
    concurrency: 15,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  await ssh.execCommand(`chown -R nginx:nginx ${pwaRemote} && chmod -R 755 ${pwaRemote}`);
  console.log('✅ PWA DEV subida exitosamente.');

  // 3. Verificación de URLs
  console.log('\n🏥 3. Verificando HTTP de ambos frontends en DEV...');
  const testWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('HTTP Status Frontend Web DEV (https://servidor.leanglobal.cl/lg-gsp-dev/):', testWeb.stdout.trim());

  const testPwa = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log('HTTP Status PWA DEV (https://servidor.leanglobal.cl/pwa-gsp-dev/):', testPwa.stdout.trim());

  ssh.dispose();
  console.log('\n🎉 Despliegue estático DEV completado con éxito.');
}

main().catch(err => {
  console.error('❌ Error en script de despliegue estático:', err);
  process.exit(1);
});
