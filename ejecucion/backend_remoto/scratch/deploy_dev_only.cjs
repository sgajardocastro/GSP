const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deployDev() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const rootDir = 'D:/SGajardo\Google Drive\Antigravity\Grúas San Pablo\Propuesta Gestión Operación Grúas';
  const localFrontendDist = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/frontend/dist';
  const remoteFrontendDev = '/var/www/html/lg-gsp-dev';

  console.log('Subiendo frontend a DEV (/var/www/html/lg-gsp-dev)...');
  await ssh.putDirectory(localFrontendDist, remoteFrontendDev, { recursive: true, concurrency: 8 });
  await ssh.execCommand(`chown -R nginx:nginx ${remoteFrontendDev}`);
  await ssh.execCommand(`chmod -R 755 ${remoteFrontendDev}`);

  console.log('Recargando Nginx...');
  await ssh.execCommand('systemctl reload nginx');

  console.log('Verificando DEV index.html:');
  const res = await ssh.execCommand('grep "<script type=" /var/www/html/lg-gsp-dev/index.html');
  console.log(res.stdout);

  ssh.dispose();
}

deployDev().catch(console.error);
