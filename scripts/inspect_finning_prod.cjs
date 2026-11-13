const https = require('https');

const token = '09accb0a56ab0cabab2101891ccf1576b208c41efd4c9f9b563201e35fc9533a30596590c9bf60589803823bb423a9b946ce1bd1cf84480970083b75fcd36b2fe06f5fface5f49fe18b2151b7c7f4ee4a65f958bcbaa38c53ca80f4c44c53b37832f4506c7f8304628fc149e4981dd6e7ce24ccbc8cd8847ff72f15b5e853b9468c010f10486e82e50b178fb0d1d09e1c031caedb6abafc4da953937992a852e39c407f53e59b711c138c1bcc75216917404c940ea43d582ad1fef41ac0ae2e421803d7f25ce7b25892309c8d7087abc01b53574f5c027f1a15c31b22b5b893afa0fcfcbbdefeb229fc98c5a67b2fa21aa1debc8bff8ba79f0a238d0e52039f609def445d225df0bf767a8acdccb3f7052f9b3f428c574d1a9b2421704859063434c40a8d788192a2a4a5ceaf4a1bad52836f509ed6dabec24d4d0bceca7b912ae372c66979a5c8890f2af6bb994ef7ba690994f0c8565ce7bc10112ed4c0699ec309a4ad9821fb24456df430dfc4b4c4825a6cd2d6b72f5f46e63fb07cb2a7e';

function fetchUrl(endpoint) {
  return new Promise((resolve) => {
    const req = https.request(`https://servidor.leanglobal.cl/lg-gsp-prod/api${endpoint}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

async function main() {
  console.log('=== INSPECCIONANDO PROYECTO 3 (FINNING PUERTO MONTT) EN PROD ===');
  
  const [repRes, viajeRes, itsRes, edpRes, actasRes] = await Promise.all([
    fetchUrl('/operaciones/report/proyecto/3'),
    fetchUrl('/operaciones/viaje/proyecto/3'),
    fetchUrl('/operaciones/its/3'),
    fetchUrl('/operaciones/edp/proyecto/3'),
    fetchUrl('/operaciones/acta-plataforma/proyecto/3')
  ]);

  console.log('REPORTS:', repRes.status, Array.isArray(repRes.body?.data) ? repRes.body.data.length : repRes.body);
  console.log('VIAJES:', viajeRes.status, Array.isArray(viajeRes.body) ? viajeRes.body.length : viajeRes.body);
  console.log('ITS:', itsRes.status, itsRes.body?.success, itsRes.body?.its ? 'TIENE ITS' : 'SIN ITS');
  if (itsRes.body?.its) console.log('ITS DETALLE:', itsRes.body.its);
  console.log('EDP:', edpRes.status, Array.isArray(edpRes.body) ? edpRes.body.length : edpRes.body);
  console.log('ACTAS:', actasRes.status, actasRes.body?.success, actasRes.body?.actas?.length);
}

main();
