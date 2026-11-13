const https = require('https');

function testEndpoint(path) {
  return new Promise((resolve) => {
    const url = `https://servidor.leanglobal.cl${path}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          bodySample: body.substring(0, 150)
        });
      });
    }).on('error', (e) => {
      resolve({ path, error: e.message });
    });
  });
}

async function runSmokeTest() {
  console.log('=== SMOKE TEST FINAL DE PRODUCCION ===\n');

  const tests = [
    '/lg-gsp-prod/',
    '/lg-gsp-prod/api/inventario/traspasos',
    '/lg-gsp-prod/api/inventario/bodegas',
    '/lg-gsp-prod/api/inventario/existencias',
    '/lg-gsp-prod/api/inventario/consumos-ot',
  ];

  for (const t of tests) {
    const res = await testEndpoint(t);
    console.log(`[${res.status}] ${t}`);
    if (res.bodySample) {
      console.log('  Data:', res.bodySample.replace(/\n/g, ' '));
    }
  }

  console.log('\n=== SMOKE TEST CONCLUIDO ===');
}

runSmokeTest().catch(console.error);
