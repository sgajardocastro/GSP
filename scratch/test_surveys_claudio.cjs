const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const crypto = require('crypto');

const ROOT_DIR = process.cwd();
const PWA_URL = 'https://servidor.leanglobal.cl/lg-gsp-dev/pwa';
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

const tokenClaudio = buildToken({
  rut: '15656864-3',
  email: 'claudiogallardo1984@gmail.com',
  nombre_user: 'Claudio GALLARDO',
  id_user: 62,
  id_empresa: 9,
  roles: ['OPERADOR', 'GSP_OPERADOR']
});

async function main() {
  const { default: puppeteer } = await import(pathToFileURL(path.join(ROOT_DIR, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    defaultViewport: { width: 390, height: 844 },
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('  [BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('  [BROWSER ERROR]', err.message));

  await page.evaluateOnNewDocument((t) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('token', t);
    const u = JSON.stringify({
      auth: true,
      id_user: 62,
      ID_USUARIO: 62,
      nombre_user: 'Claudio GALLARDO',
      email: 'claudiogallardo1984@gmail.com',
      id_empresa: 9,
      roles: ['OPERADOR', 'GSP_OPERADOR']
    });
    localStorage.setItem('user', u);
    localStorage.setItem('userDetail', u);
    localStorage.setItem('perfil', u);
  }, tokenClaudio);

  console.log('Navegando a surveys...');
  await page.goto(`${PWA_URL}/#/surveys`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));

  const info = await page.evaluate(() => {
    return {
      href: window.location.href,
      title: document.title,
      text: document.body.innerText,
      btns: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
      chips: Array.from(document.querySelectorAll('.v-chip')).map(c => c.innerText.trim()).filter(Boolean)
    };
  });

  console.log('INFO SURVEYS:', JSON.stringify(info, null, 2));
  await browser.close();
}

main().catch(console.error);
