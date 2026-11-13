const https = require('https');

async function testContabilidad() {
  const options = {
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/api/operaciones/edp/perspectiva-contabilidad',
    method: 'GET',
    rejectUnauthorized: false
  };

  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

testContabilidad().then(r => {
  if (r.body && r.body.success) {
    const p1 = r.body.data.procesos.find(p => p.id_proyecto === 1);
    console.log('Proyecto ID 1 encontrado en PROD:');
    console.log(JSON.stringify(p1, null, 2));
  }
}).catch(console.error);
