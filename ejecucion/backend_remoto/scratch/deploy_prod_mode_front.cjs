const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployProdFront() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  const localFrontendDist = `${rootDir}/ejecucion/frontend/dist`;
  const remoteFrontendProd = '/var/www/html/lg-gsp-prod';

  console.log('1. Subiendo frontend compilado a PROD (/var/www/html/lg-gsp-prod)...');
  await ssh.putDirectory(localFrontendDist, remoteFrontendProd, { recursive: true, concurrency: 8 });
  await ssh.execCommand(`chown -R nginx:nginx ${remoteFrontendProd}`);
  await ssh.execCommand(`chmod -R 755 ${remoteFrontendProd}`);

  console.log('2. Recargando Nginx...');
  await ssh.execCommand('systemctl reload nginx');

  console.log('3. Verificando script en index.html de PROD...');
  const res = await ssh.execCommand('grep "<script type=" /var/www/html/lg-gsp-prod/index.html');
  console.log(res.stdout);

  ssh.dispose();
}

deployProdFront().catch(console.error);
