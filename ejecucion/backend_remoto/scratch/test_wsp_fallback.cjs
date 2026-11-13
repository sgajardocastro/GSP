const http = require('http');
const https = require('https');

function enviarSolicitudHttp(urlDestino, payloadObj, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlDestino);
      const isHttps = u.protocol === 'https:';
      const lib = isHttps ? https : http;
      const postData = JSON.stringify(payloadObj);

      const options = {
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + (u.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: timeoutMs
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: parsed });
          } catch (_) {
            resolve({ statusCode: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, raw: data });
          }
        });
      });

      req.on('error', err => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout (${timeoutMs}ms) conectando a ${urlDestino}`));
      });

      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function test() {
  const payload = {
    numero: '56936483259',
    mensaje: '✅ Test automático de fallback resiliente WhatsApp (LeanGlobal).'
  };
  
  const endpoints = [
    'http://127.0.0.1:3085/enviar', // Fallará localmente
    'https://servidor.leanglobal.cl/lg-gsp-dev/whatsapp/enviar' // Debe tomar el fallback inmediatamente
  ];

  for (const ep of endpoints) {
    try {
      console.log(`Intentando conectar a ${ep}...`);
      const res = await enviarSolicitudHttp(ep, payload, 5000);
      console.log(`Resultado de ${ep}:`, res);
      if (res.ok) break;
    } catch (e) {
      console.log(`Error esperado en ${ep}: ${e.message}`);
    }
  }
}

test();
