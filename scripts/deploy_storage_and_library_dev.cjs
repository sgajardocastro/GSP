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

async function deploy() {
  console.log('=== Despliegue de Normalización Storage & Biblioteca Documental a DEV ===');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida con éxito.\n');

  // 1. BACKEND FILES
  console.log('--- 1. TRANSFERIENDO ARCHIVOS BACKEND A DEV ---');
  const backendBase = '/home/nodeadmin/proyectos/lean-services-gsp';
  
  const filesToTransfer = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/actaPlataformaModel.js'),
      remote: `${backendBase}/src/models/actaPlataformaModel.js`
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/actaPlataformaController.js'),
      remote: `${backendBase}/src/controllers/actaPlataformaController.js`
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/routes/actaPlataformaRoutes.js'),
      remote: `${backendBase}/src/routes/actaPlataformaRoutes.js`
    }
  ];

  for (const f of filesToTransfer) {
    console.log(`Subiendo ${path.basename(f.local)} -> ${f.remote}...`);
    await ssh.putFile(f.local, f.remote);
  }

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${backendBase}/src/models ${backendBase}/src/controllers ${backendBase}/src/routes`);
  console.log('Permisos corregidos para nodeadmin en backend.\n');

  // 2. REINICIO PM2
  console.log('--- 2. REINICIANDO PROCESO PM2 10 (lean-services-gsp DEV) ---');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // 3. FRONTEND WEB DEV
  console.log('--- 3. SUBIENDO FRONTEND WEB A DEV (/var/www/html/lg-gsp-dev) ---');
  const localWebDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const remoteWebDev = '/var/www/html/lg-gsp-dev';

  const statusWeb = await ssh.putDirectory(localWebDist, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  if (!statusWeb) throw new Error('Fallo al transferir Frontend Web a DEV');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('Frontend Web actualizado en DEV con permisos nginx:nginx 755.\n');

  ssh.dispose();

  // 4. VERIFICACIÓN HTTP
  console.log('--- 4. VERIFICANDO RESPUESTA HTTP DEV ---');
  const actasCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/acta-plataforma');
  console.log(`GET /api/operaciones/acta-plataforma -> Status: ${actasCheck.status}`);

  const webCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`GET /lg-gsp-dev/ -> Status: ${webCheck.status}`);

  console.log('\n=== Despliegue completado exitosamente ===');
}

deploy().catch(err => {
  console.error('Error durante el despliegue:', err);
  process.exit(1);
});
