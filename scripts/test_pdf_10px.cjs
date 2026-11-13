const https = require('https');

async function testPdf() {
  const url = 'https://servidor.leanglobal.cl/lg-gsp-dev/api/archivo/ver/1467';
  console.log(`Comprobando acceso a ${url}...`);
  https.get(url, (res) => {
    console.log('Status code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Length:', res.headers['content-length']);
  }).on('error', (e) => {
    console.error('Error:', e.message);
  });
}

testPdf();
