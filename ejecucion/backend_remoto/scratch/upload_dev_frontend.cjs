const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  console.log('Subiendo frontend compilado a DEV (/var/www/html/lg-gsp-dev)...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  const localFrontendDist = `${rootDir}/ejecucion/frontend/dist`;
  const remoteFrontendDev = '/var/www/html/lg-gsp-dev';

  await ssh.putDirectory(localFrontendDist, remoteFrontendDev, { recursive: true, concurrency: 8 });
  await ssh.execCommand(`chown -R nginx:nginx ${remoteFrontendDev} && chmod -R 755 ${remoteFrontendDev}`);
  console.log('✅ Frontend DEV actualizado exitosamente.');

  const check = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-dev/ | head -n 1');
  console.log('HTTP Status DEV:', check.stdout.trim());

  ssh.dispose();
}

run();
