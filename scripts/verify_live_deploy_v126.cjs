const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function verify() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICACIÓN DE PROCESOS PM2 ===');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 list"');
  console.log(pm2Res.stdout);

  console.log('\n=== VERIFICACIÓN NGINX PORTS & PROXY ===');
  const nginxDev = await ssh.execCommand('grep -rn "proxy_pass" /etc/nginx/conf.d/ /etc/nginx/nginx.conf 2>/dev/null | grep -E "gsp|300"');
  console.log(nginxDev.stdout);

  console.log('\n=== VERIFICACIÓN ENDPOINT TRANSICION LIST DEV (HTTPS) ===');
  const devRes = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/its/transicion/list');
  try {
    const jsonDev = JSON.parse(devRes.stdout);
    console.log(`DEV Success: ${jsonDev.success}, Total registros: ${jsonDev.data?.length}`);
    if (jsonDev.data && jsonDev.data.length > 0) {
      console.log('DEV Primer registro:', {
        folio: jsonDev.data[0].folio_its,
        estado: jsonDev.data[0].estado,
        nombre_elaborador: jsonDev.data[0].nombre_elaborador
      });
    }
  } catch (e) {
    console.log('DEV Raw:', devRes.stdout.substring(0, 200));
  }

  console.log('\n=== VERIFICACIÓN ENDPOINT TRANSICION LIST PROD (HTTPS) ===');
  const prodRes = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/its/transicion/list');
  try {
    const jsonProd = JSON.parse(prodRes.stdout);
    console.log(`PROD Success: ${jsonProd.success}, Total registros: ${jsonProd.data?.length}`);
    if (jsonProd.data && jsonProd.data.length > 0) {
      console.log('PROD Primer registro:', {
        folio: jsonProd.data[0].folio_its,
        estado: jsonProd.data[0].estado,
        nombre_elaborador: jsonProd.data[0].nombre_elaborador
      });
    }
  } catch (e) {
    console.log('PROD Raw:', prodRes.stdout.substring(0, 200));
  }

  ssh.dispose();
}

verify().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
