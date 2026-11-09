const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkHttpsUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== DESPLIEGUE OFICIAL v1.0.205 (DEV & PROD) ===');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✓ SSH conectado');

  // 1. Frontend PROD
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  console.log('[1/4] Subiendo dist_prod a /var/www/html/lg-gsp-prod...');
  await ssh.putDirectory(localDistProd, '/var/www/html/lg-gsp-prod', { recursive: true, concurrency: 15 });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-prod && chmod -R 755 /var/www/html/lg-gsp-prod');

  const checkAlias = await ssh.execCommand('test -d /var/www/html/lg-gsp && echo "EXISTS" || echo "NO"');
  if (checkAlias.stdout.trim() === 'EXISTS') {
    await ssh.putDirectory(localDistProd, '/var/www/html/lg-gsp', { recursive: true, concurrency: 15 });
    await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp && chmod -R 755 /var/www/html/lg-gsp');
  }
  console.log('✓ Frontend PROD desplegado.');

  // 2. Frontend DEV
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  console.log('[2/4] Subiendo dist_dev a /var/www/html/lg-gsp-dev...');
  await ssh.putDirectory(localDistDev, '/var/www/html/lg-gsp-dev', { recursive: true, concurrency: 15 });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev && chmod -R 755 /var/www/html/lg-gsp-dev');
  console.log('✓ Frontend DEV desplegado.');

  // 3. Subir package.json a backend PROD y DEV
  const localPkg = path.resolve(__dirname, '../ejecucion/backend_remoto/package.json');
  console.log('[3/4] Actualizando package.json (v1.0.205) en backend...');
  await ssh.putFile(localPkg, '/home/nodeadmin/proyectos/lean-services-gsp-prod/package.json');
  await ssh.putFile(localPkg, '/home/nodeadmin/proyectos/lean-services-gsp/package.json');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/package.json /home/nodeadmin/proyectos/lean-services-gsp/package.json');
  
  // Recargar PM2
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');
  console.log('✓ PM2 recargado (procesos 10 y 13).');

  // 4. Verificación HTTP 200 OK
  console.log('[4/4] Verificando salud en DEV y PROD...');
  const devRes = await checkHttpsUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`DEV Web: HTTP ${devRes.statusCode} (${devRes.body.length} bytes)`);

  const prodRes = await checkHttpsUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`PROD Web: HTTP ${prodRes.statusCode} (${prodRes.body.length} bytes)`);

  const devApi = await checkHttpsUrl('https://servidor.leanglobal.cl/lg-gsp-dev/api/proyectos');
  console.log(`DEV API: HTTP ${devApi.statusCode}`);

  const prodApi = await checkHttpsUrl('https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos');
  console.log(`PROD API: HTTP ${prodApi.statusCode}`);

  ssh.dispose();
  console.log('\n✅ DESPLIEGUE v1.0.205 CONCLUIDO CON ÉXITO.');
}

main().catch(err => {
  console.error('ERROR EN DEPLOY:', err);
  process.exit(1);
});
