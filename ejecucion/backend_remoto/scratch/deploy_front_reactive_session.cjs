const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployFront() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  const localFrontendDist = `${rootDir}/ejecucion/frontend/dist`;
  const remoteFrontendProd = '/var/www/html/lg-gsp-prod';
  const remoteFrontendDev = '/var/www/html/lg-gsp-dev';

  console.log('1. Subiendo frontend compilado a PROD (/var/www/html/lg-gsp-prod)...');
  await ssh.putDirectory(localFrontendDist, remoteFrontendProd, { recursive: true, concurrency: 8 });
  await ssh.execCommand(`chown -R nginx:nginx ${remoteFrontendProd}`);
  await ssh.execCommand(`chmod -R 755 ${remoteFrontendProd}`);

  console.log('2. Subiendo frontend compilado a DEV (/var/www/html/lg-gsp-dev)...');
  await ssh.putDirectory(localFrontendDist, remoteFrontendDev, { recursive: true, concurrency: 8 });
  await ssh.execCommand(`chown -R nginx:nginx ${remoteFrontendDev}`);
  await ssh.execCommand(`chmod -R 755 ${remoteFrontendDev}`);

  console.log('3. Recargando Nginx...');
  const resNginx = await ssh.execCommand('systemctl reload nginx');
  console.log(resNginx.stdout || 'Nginx recargado OK');

  console.log('✅ Despliegue de frontend reactivo completado en DEV y PROD.');

  ssh.dispose();
}

deployFront().catch(console.error);
