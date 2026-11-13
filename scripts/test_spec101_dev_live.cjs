const fs = require('fs');
const path = require('path');
const https = require('https');

async function testPdf(pdfFileName) {
  const pdfPath = path.resolve(__dirname, '../Contabilidad', pdfFileName);
  if (!fs.existsSync(pdfPath)) {
    throw new Error('No se encontró el PDF real en ' + pdfPath);
  }
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  const payload = JSON.stringify({
    pdf_base64: pdfBase64,
    nombre_archivo: pdfFileName
  });

  const options = {
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/api/operaciones/edp/parsear-dte-pdf',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    rejectUnauthorized: false
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(data)
        });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== TEST SUITE REQ-1070 (LAUDUS & SII) EN DEV ===\n');

  // Caso 1: Laudus ERP (Grúas San Pablo)
  console.log('--- Test 1: Laudus ERP (DTE 14664) ---');
  const res1 = await testPdf('DTE 14664 de LUIS GHISELLINI J ARREND MAQ Y VEH MOTOR EN GRAL EIRL (1).pdf');
  console.log('Status:', res1.statusCode);
  console.log('Folio:', res1.body.data.folio_dte, '| Emisor:', res1.body.data.empresa_facturadora, '| Formato:', res1.body.data.formato_detectado, '| Neto:', res1.body.data.monto_neto);
  if (res1.body.data.folio_dte !== '14664' || res1.body.data.empresa_facturadora !== 'Grúas San Pablo' || res1.body.data.monto_neto !== 1820000) {
    throw new Error('Fallo en Test 1');
  }
  console.log('✔ Test 1 PASÓ\n');

  // Caso 2: Portal SII (Bestmaq)
  console.log('--- Test 2: Portal SII (Fact. 2907) ---');
  const res2 = await testPdf('Fact. 2907 Soc. Hormigones y Baldosas.pdf');
  console.log('Status:', res2.statusCode);
  console.log('Folio:', res2.body.data.folio_dte, '| Emisor:', res2.body.data.empresa_facturadora, '| Formato:', res2.body.data.formato_detectado, '| Neto:', res2.body.data.monto_neto);
  if (res2.body.data.folio_dte !== '2907' || res2.body.data.empresa_facturadora !== 'Bestmaq' || res2.body.data.monto_neto !== 16750000) {
    throw new Error('Fallo en Test 2');
  }
  console.log('✔ Test 2 PASÓ\n');

  // Caso 3: Portal SII (Logística del Sur)
  console.log('--- Test 3: Portal SII (Fact. 3669) ---');
  const res3 = await testPdf('Fact. 3669 Aquamet SA.pdf');
  console.log('Status:', res3.statusCode);
  console.log('Folio:', res3.body.data.folio_dte, '| Emisor:', res3.body.data.empresa_facturadora, '| Formato:', res3.body.data.formato_detectado, '| Neto:', res3.body.data.monto_neto);
  if (res3.body.data.folio_dte !== '3669' || res3.body.data.empresa_facturadora !== 'Logística del Sur' || res3.body.data.monto_neto !== 807500) {
    throw new Error('Fallo en Test 3');
  }
  console.log('✔ Test 3 PASÓ\n');

  // Caso 4: Portal SII (Royal Rental)
  console.log('--- Test 4: Portal SII (Fact. 83) ---');
  const res4 = await testPdf('Fact. 83 Const. Ingevec SA.pdf');
  console.log('Status:', res4.statusCode);
  console.log('Folio:', res4.body.data.folio_dte, '| Emisor:', res4.body.data.empresa_facturadora, '| Formato:', res4.body.data.formato_detectado, '| Neto:', res4.body.data.monto_neto);
  if (res4.body.data.folio_dte !== '83' || res4.body.data.empresa_facturadora !== 'Royal Rental' || res4.body.data.monto_neto !== 200000) {
    throw new Error('Fallo en Test 4');
  }
  console.log('✔ Test 4 PASÓ\n');

  console.log('🎉 TODOS LOS CASOS REALES DE AUDITORÍA VALIDADOS CON ÉXITO EN EL SERVIDOR DEV.');
}

main().catch(err => {
  console.error('Error en suite:', err.message);
  process.exit(1);
});
