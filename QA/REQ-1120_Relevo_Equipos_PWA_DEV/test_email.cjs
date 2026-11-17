const crypto = require('crypto');
const jwtSecret = 'una_clave_super_segura_para_firma_gsp';
const jwtEncryptSecret = 'otra_clave_distinta_para_cifrado_gsp';

function encryptToken(token, secret) {
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(secret, 'salt', 32), Buffer.alloc(16, 0));
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function buildToken(payload) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + 7 * 86400 };
  const unsigned = b64(header) + '.' + b64(fullPayload);
  const sig = crypto.createHmac('sha256', jwtSecret).update(unsigned).digest('base64url');
  return encryptToken(unsigned + '.' + sig, jwtEncryptSecret);
}

const token = buildToken({ rut: '12345678-9', email: 'sgajardoc@gmail.com', nombre_user: 'Sergio Gajardo', id_user: 55, id_empresa: 9, roles: ['ADMIN'] });

async function run() {
  console.log('Probando POST /message...');
  const t0 = Date.now();
  try {
    const res = await fetch('https://servidor.leanglobal.cl/lg-gsp-dev/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        para: 'sgajardoc@gmail.com',
        cc: '',
        asunto: 'Test Certificacion QA REQ-1120',
        cuerpo: '<p>Prueba de envio de correo</p>'
      })
    });
    console.log(`Respuesta recibida en ${Date.now() - t0} ms. Status: ${res.status}`);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
