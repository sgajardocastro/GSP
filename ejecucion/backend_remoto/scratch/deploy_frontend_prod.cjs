const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  const root = 'D:\\SGajardo\\Google Drive\\Antigravity\\Grúas San Pablo\\Propuesta Gestión Operación Grúas\\ejecucion\\frontend';
  const distDir = path.join(root, 'dist');
  const remoteWeb = '/var/www/html/lg-gsp-prod';

  console.log('=== LIMPIANDO Y SUBIENDO A /var/www/html/lg-gsp-prod ===');
  await ssh.execCommand(`rm -rf ${remoteWeb}/*`);

  const status = await ssh.putDirectory(distDir, remoteWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log('Transferencia:', status ? 'EXITOSA' : 'FALLO');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWeb} && chmod -R 755 ${remoteWeb}`);
  console.log('Permisos asignados a nginx:nginx');

  const idxHtml = await ssh.execCommand(`cat ${remoteWeb}/index.html`);
  console.log('index.html:\n', idxHtml.stdout);

  ssh.dispose();
  console.log('=== DEPLOY FRONTEND PROD COMPLETADO ===');
}

run().catch(console.error);
