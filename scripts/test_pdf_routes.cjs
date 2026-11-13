const https = require('https');

function check(path) {
  return new Promise((resolve) => {
    https.get({
      hostname: 'servidor.leanglobal.cl',
      port: 443,
      path: '/lg-gsp-prod/api' + path,
      rejectUnauthorized: false
    }, (res) => {
      resolve({ path, status: res.statusCode, type: res.headers['content-type'] });
    }).on('error', (e) => resolve({ path, error: e.message }));
  });
}

async function run() {
  console.log('Verificando rutas de PDF en PROD:');
  const r1 = await check('/operaciones/edp/proyecto/1/pdf');
  console.log('1. EDP PDF:', r1);
  const r2 = await check('/operaciones/its/preview-pdf/1');
  console.log('2. ITS PDF:', r2);
  const r3 = await check('/operaciones/report/39/pdf');
  console.log('3. Report PDF:', r3);
}

run();
