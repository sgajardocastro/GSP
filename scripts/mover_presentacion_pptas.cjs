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

async function run() {
  console.log('--- CONECTANDO A SERVIDOR REMOTO ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('Conexión SSH establecida.');

  const targetDir = '/var/www/html/pptas/GSP/reuniones';
  await ssh.execCommand(`mkdir -p ${targetDir}/img_taller_bodega`);

  const localHtml = path.resolve(__dirname, '../antecedentes_reuniones/presentaciones/presentacion_flujo_taller_y_bodega.html');
  const targetHtml = `${targetDir}/presentacion_flujo_taller_y_bodega.html`;

  console.log(`Subiendo presentación a ${targetHtml}...`);
  await ssh.putFile(localHtml, targetHtml);

  const localImg = path.resolve(__dirname, '../antecedentes_reuniones/presentaciones/img_taller_bodega');
  const targetImg = `${targetDir}/img_taller_bodega`;

  console.log(`Subiendo imágenes a ${targetImg}...`);
  await ssh.putDirectory(localImg, targetImg, { recursive: true, concurrency: 10 });

  await ssh.execCommand(`chmod -R 755 ${targetDir}`);
  console.log('Permisos 755 asignados a', targetDir);

  // Limpiar de prod y dev donde no corresponden
  console.log('Limpiando archivos de prod y dev...');
  await ssh.execCommand('rm -rf /var/www/html/lg-gsp-prod/presentacion_flujo_taller_y_bodega.html /var/www/html/lg-gsp-prod/img_taller_bodega');
  await ssh.execCommand('rm -rf /var/www/html/lg-gsp-dev/presentacion_flujo_taller_y_bodega.html /var/www/html/lg-gsp-dev/img_taller_bodega');

  const listRes = await ssh.execCommand(`ls -lh ${targetDir}`);
  console.log('Contenido de', targetDir, ':\n', listRes.stdout);

  ssh.dispose();

  console.log('--- VERIFICANDO URL PÚBLICA ---');
  const targetUrl = 'https://servidor.leanglobal.cl/pptas/GSP/reuniones/presentacion_flujo_taller_y_bodega.html';
  const res = await checkUrl(targetUrl);
  console.log(`HTTP Status de ${targetUrl}: ${res.status}`);

  const imgUrl = 'https://servidor.leanglobal.cl/pptas/GSP/reuniones/img_taller_bodega/pantalla_02_busqueda_stock_repuestos.png';
  const imgRes = await checkUrl(imgUrl);
  console.log(`HTTP Status de imagen ${imgUrl}: ${imgRes.status}`);
}

run().catch(console.error);
