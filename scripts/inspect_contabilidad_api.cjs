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
  console.log('Status:', r.status);
  if (r.body && r.body.success) {
    console.log('Total procesos devueltos:', r.body.data.procesos.length);
    console.log('\nPrimeros 5 procesos:');
    r.body.data.procesos.slice(0, 8).forEach(p => {
      console.log(`- ID: ${p.id_proyecto} | Codi: ${p.codi_proyecto} | Cliente: ${p.cliente_nombre} | Comprometido: ${p.monto_comprometido} | Devengado: ${p.monto_devengado_reports} | Total Reports: ${p.total_reports} | EDP: ${p.edp_emitido} | Facturas DTE: ${(p.facturas_dte || []).length} | Facturado: ${p.monto_facturado_neto} | Saldo: ${p.saldo_pendiente_facturar}`);
    });
  } else {
    console.log('Error o sin datos:', r);
  }
}).catch(console.error);
