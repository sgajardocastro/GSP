const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployV1087() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE A PRODUCCIÓN v1.0.87 (FRONTEND + PWA)');
  console.log('==================================================================');

  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 20000
    });
    console.log('✅ Conectado como root por SSH.');

    const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
    const localWebDist = `${rootDir}/ejecucion/frontend/dist`;
    const localPwaDist = `${rootDir}/ejecucion/pwa/dist`;

    const remoteWebProd = '/var/www/html/lg-gsp-prod';
    const remotePwaProd = '/var/www/html/pwa-gsp-prod';

    const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

    // 1. Respaldos
    console.log('\n📦 1. Creando respaldos...');
    await ssh.execCommand('mkdir -p /var/www/html/backups');
    await ssh.execCommand(`tar -czf /var/www/html/backups/lg-gsp-prod-v1087-${ts}.tar.gz -C /var/www/html lg-gsp-prod 2>/dev/null`);
    await ssh.execCommand(`tar -czf /var/www/html/backups/pwa-gsp-prod-v1087-${ts}.tar.gz -C /var/www/html pwa-gsp-prod 2>/dev/null`);
    console.log('✅ Respaldos completados.');

    // 2. Subir Frontend Web a PROD
    console.log(`\n⬆️ 2. Subiendo Frontend Web a ${remoteWebProd}...`);
    const webStatus = await ssh.putDirectory(localWebDist, remoteWebProd, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });
    console.log('Frontend Web status:', webStatus ? 'OK' : 'FAIL');

    // 3. Subir PWA a PROD
    console.log(`\n⬆️ 3. Subiendo PWA a ${remotePwaProd}...`);
    const pwaStatus = await ssh.putDirectory(localPwaDist, remotePwaProd, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });
    console.log('PWA status:', pwaStatus ? 'OK' : 'FAIL');

    // 4. Permisos
    console.log('\n🔒 4. Ajustando permisos nginx:nginx...');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteWebProd} ${remotePwaProd}`);
    await ssh.execCommand(`chmod -R 755 ${remoteWebProd} ${remotePwaProd}`);

    // 5. Nginx reload
    console.log('\n🔄 5. Recargando Nginx...');
    await ssh.execCommand('systemctl reload nginx');

    // 6. Verificaciones
    console.log('\n🔍 6. Verificando despliegue...');
    const webCheck = await ssh.execCommand(`head -n 5 ${remoteWebProd}/index.html`);
    console.log('Web index.html head:\n', webCheck.stdout);

    const pwaCheck = await ssh.execCommand(`head -n 5 ${remotePwaProd}/index.html`);
    console.log('PWA index.html head:\n', pwaCheck.stdout);

    console.log('\n==================================================================');
    console.log('🎉 DESPLIEGUE v1.0.87 EN PRODUCCIÓN FINALIZADO EXITOSAMENTE');
    console.log('==================================================================');
  } catch (err) {
    console.error('❌ Error en despliegue:', err);
  } finally {
    ssh.dispose();
  }
}

deployV1087().catch(console.error);
