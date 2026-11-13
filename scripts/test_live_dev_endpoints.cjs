const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testEndpoints() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== TEST EN VIVO DE ENDPOINTS WMS-LITE DEV ===\n');


  const endpoints = [
    '/api/inventario/bodegas',
    '/api/inventario/ubicaciones',
    '/api/inventario/productos?limit=5',
    '/api/inventario/existencias?limit=5',
    '/api/inventario/alertas/reposicion',
    '/api/inventario/kardex?limit=5'
  ];

  for (const ep of endpoints) {
    const res = await ssh.execCommand(`curl -s "http://127.0.0.1:3006${ep}"`);
    console.log(`GET ${ep}:`);
    try {
      const json = JSON.parse(res.stdout);
      console.log(`  Success: ${json.success}, Count: ${json.count || json.data?.length}`);
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        console.log('  Muestra primer item:', JSON.stringify(json.data[0]));
      } else if (!json.success) {
        console.log('  Error:', json.error);
      }
    } catch (e) {
      console.log('  Raw output:', res.stdout.substring(0, 200));
    }
    console.log('------------------------------------------------------------');
  }

  // Verificar estado de Frontend en HTTPS
  const httpCode = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`\nFrontend HTTPS Status (https://servidor.leanglobal.cl/lg-gsp-dev/): ${httpCode.stdout.trim()}`);

  ssh.dispose();
}

testEndpoints().catch(console.error);
