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
  console.log('--- SUBIENDO PRESENTACIÓN A PRODUCCIÓN ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('Conexión SSH establecida.');

  const localHtml = path.resolve(__dirname, '../antecedentes_reuniones/presentaciones/presentacion_flujo_taller_y_bodega.html');
  const remoteHtmlProd = '/var/www/html/lg-gsp-prod/presentacion_flujo_taller_y_bodega.html';
  const remoteHtmlDev = '/var/www/html/lg-gsp-dev/presentacion_flujo_taller_y_bodega.html';

  console.log('Subiendo HTML a PROD y DEV...');
  await ssh.putFile(localHtml, remoteHtmlProd);
  await ssh.putFile(localHtml, remoteHtmlDev);

  const localImg = path.resolve(__dirname, '../antecedentes_reuniones/presentaciones/img_taller_bodega');
  const remoteImgProd = '/var/www/html/lg-gsp-prod/img_taller_bodega';
  const remoteImgDev = '/var/www/html/lg-gsp-dev/img_taller_bodega';

  console.log('Subiendo carpeta de imágenes a PROD...');
  await ssh.putDirectory(localImg, remoteImgProd, { recursive: true, concurrency: 10 });
  console.log('Subiendo carpeta de imágenes a DEV...');
  await ssh.putDirectory(localImg, remoteImgDev, { recursive: true, concurrency: 10 });

  await ssh.execCommand('chmod -R 755 /var/www/html/lg-gsp-prod/presentacion_flujo_taller_y_bodega.html /var/www/html/lg-gsp-prod/img_taller_bodega');
  await ssh.execCommand('chmod -R 755 /var/www/html/lg-gsp-dev/presentacion_flujo_taller_y_bodega.html /var/www/html/lg-gsp-dev/img_taller_bodega');

  console.log('Verificando acceso público HTTPS...');
  const prodUrl = 'https://servidor.leanglobal.cl/lg-gsp-prod/presentacion_flujo_taller_y_bodega.html';
  const res = await checkUrl(prodUrl);
  console.log(`URL: ${prodUrl} -> HTTP ${res.status}`);

  const imgTestUrl = 'https://servidor.leanglobal.cl/lg-gsp-prod/img_taller_bodega/pantalla_02_busqueda_stock_repuestos.png';
  const imgRes = await checkUrl(imgTestUrl);
  console.log(`IMG: ${imgTestUrl} -> HTTP ${imgRes.status}`);

  ssh.dispose();
  console.log('Listo.');
}

runDeploy().catch(err => {
  console.error('Error al desplegar:', err);
  process.exit(1);
});
