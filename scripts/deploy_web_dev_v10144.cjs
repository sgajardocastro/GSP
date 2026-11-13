const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function runDeploy() {
  console.log('========================================================================');
  console.log('DESPLIEGUE A DEV: FRONTEND WEB v1.0.144 (REQ-1051)');
  console.log('========================================================================\n');

  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: process.env.SSH_PASSWORD || 'lgbl2025.',
      port: 1295,
      readyTimeout: 30000
    });
    console.log('Conectado como root por SSH.\n');

    // DESPLIEGUE FRONTEND WEB DEV
    console.log('--- SUBIENDO FRONTEND WEB A DEV (/var/www/html/lg-gsp-dev) ---');
    const localWebDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
    const remoteWebDev = '/var/www/html/lg-gsp-dev';

    console.log(`Subiendo archivos desde ${localWebDist} a ${remoteWebDev}...`);
    const statusWeb = await ssh.putDirectory(localWebDist, remoteWebDev, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });
    if (!statusWeb) throw new Error('Fallo al transferir Frontend Web a DEV');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
    console.log('Frontend Web v1.0.144 desplegado en DEV con permisos nginx:nginx 755.\n');

    ssh.dispose();

    // Verificación HTTP
    console.log('--- VERIFICANDO ESTADO HTTP DEV ---');
    const webCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
    console.log(`URL Web DEV: https://servidor.leanglobal.cl/lg-gsp-dev/ -> Status: ${webCheck.status}`);

    if (webCheck.status === 200) {
      console.log('\n========================================================================');
      console.log('DESPLIEGUE DEV COMPLETADO CON EXITO (HTTP 200 OK)');
      console.log('========================================================================');
    } else {
      console.warn('Advertencia: El endpoint no retorno 200 OK.');
    }
  } catch (err) {
    console.error('Error durante el despliegue:', err);
    if (ssh.isConnected()) ssh.dispose();
    process.exit(1);
  }
}

runDeploy();
