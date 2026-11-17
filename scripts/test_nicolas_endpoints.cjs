const https = require('https');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  const r1 = await getJson('https://servidor.leanglobal.cl/lg-gsp-prod/api/reports/usuario/pendientes?id_user=45');
  console.log('REPORTS PENDIENTES NICOLAS (45):', JSON.stringify(r1, null, 2));

  const r2 = await getJson('https://servidor.leanglobal.cl/lg-gsp-prod/api/viajes/usuario/activo?id_user=45');
  console.log('VIAJE ACTIVO NICOLAS (45):', JSON.stringify(r2, null, 2));
})();
