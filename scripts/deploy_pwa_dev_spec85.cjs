const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function deployPwaDev() {
  console.log('=== DESPLEGANDO PWA A DEV (/var/www/html/pwa-gsp-dev) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });
  console.log('✅ Conectado a servidor SSH.');

  const localDistDev = path.resolve(__dirname, '../ejecucion/pwa/dist');
  const remotePwaDev = '/var/www/html/pwa-gsp-dev';

  console.log(`Subiendo archivos desde ${localDistDev} a ${remotePwaDev}...`);
  const status = await ssh.putDirectory(localDistDev, remotePwaDev, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  if (!status) {
    throw new Error('Fallo al transferir archivos de PWA a DEV');
  }

  console.log('Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remotePwaDev} && chmod -R 755 ${remotePwaDev}`);

  const res = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log('HTTP Status DEV PWA:', res.status);

  ssh.dispose();
  console.log('✅ Despliegue de PWA DEV finalizado exitosamente.');
}

deployPwaDev().catch(err => {
  console.error('Error desplegando PWA DEV:', err);
  process.exit(1);
});
