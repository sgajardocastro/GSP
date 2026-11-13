const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployFrontendDev() {
  console.log('Conectando a servidor SSH para desplegar Frontend en DEV...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const remoteDir = '/var/www/html/lg-gsp-dev';

  console.log(`Subiendo ${localDist} a ${remoteDir}...`);
  const status = await ssh.putDirectory(localDist, remoteDir, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });

  if (!status) {
    throw new Error('Fallo al transferir archivos del directorio dist');
  }

  console.log('Fijando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} && chmod -R 755 ${remoteDir}`);

  const res = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('HTTP Status DEV:', res.stdout.trim());

  ssh.dispose();
}

deployFrontendDev().catch(err => {
  console.error('Error desplegando frontend DEV:', err);
  process.exit(1);
});
