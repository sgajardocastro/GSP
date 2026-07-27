const https = require('https');
const servicios = require('../src/config/servicios.js');

async function testEndpoint(uri) {
  return new Promise((resolve) => {
    const url = `https://servidor.leanglobal.cl/lg-gsp${uri}?_id_empresa=9`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          uri,
          status: res.statusCode,
          response: data.trim()
        });
      });
    }).on('error', (err) => {
      resolve({
        uri,
        status: 0,
        response: err.message
      });
    });
  });
}

async function run() {
  console.log(`Starting diagnosis of all ${servicios.length} endpoints...`);
  const results = [];

  for (const s of servicios) {
    if (!s.uri) continue;
    // Evitar endpoints que requieran parámetros obligatorios en la URI misma o de prueba
    if (s.uri.includes(':') || s.uri === '/ejemplo' || s.uri === '/ejemplo2' || s.uri === '/prueba') continue;

    const res = await testEndpoint(s.uri);
    results.push(res);
    if (res.status !== 200) {
      console.log(`❌ ERROR en ${res.uri}: Status ${res.status} -> ${res.response.substring(0, 150)}`);
    } else {
      console.log(`✅ OK en ${res.uri}`);
    }
  }

  console.log('\n--- DIAGNOSIS SUMMARY (ONLY ERRORS) ---');
  const errors = results.filter(r => r.status !== 200);
  console.log(`Total Errors Found: ${errors.length}`);
  errors.forEach(e => {
    console.log(`URI: ${e.uri} | Status: ${e.status} | Response: ${e.response.substring(0, 200)}`);
  });
}

run();
