import https from 'https';

const BASE_URL = 'https://servidor.leanglobal.cl/lg-gsp-dev/api/mantenimiento';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=================================================================');
  console.log('🚀 AUDITORÍA CANÓNICA DE ENDPOINTS: MANTENIMIENTO ENTERPRISE DEV');
  console.log('=================================================================');

  const eps = [
    { path: '/kpis', desc: 'Dashboard KPIs Corporativos' },
    { path: '/flota/radar', desc: 'Radar de Horómetros y Flota 360°' },
    { path: '/pautas', desc: 'Pautas Preventivas Cíclicas PM' },
    { path: '/parametros', desc: 'Parámetros Operacionales Taller' },
    { path: '/ots', desc: 'Bandeja de Ordenes de Trabajo (OT)' },
    { path: '/hallazgos', desc: 'Registro de Hallazgos C1-C4' },
    { path: '/avisos', desc: 'Avisos de Avería / Solicitudes' }
  ];

  for (const item of eps) {
    const res = await fetchJson(`${BASE_URL}${item.path}`);
    const ok = res.status === 200 && res.body?.success;
    console.log(`${ok ? '✅' : '❌'} ${item.path.padEnd(16)} HTTP ${res.status} | ${item.desc}`);
    if (item.path === '/kpis') {
      console.log('   📊 KPIs:', JSON.stringify(res.body?.data));
    }
  }
  console.log('=================================================================');
}

runTests();
