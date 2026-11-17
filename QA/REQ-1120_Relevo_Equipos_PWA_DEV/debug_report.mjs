import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const PWA_URL = 'https://servidor.leanglobal.cl/pwa-gsp-dev';

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
  const unsigned = `${b64(header)}.${b64(fullPayload)}`;
  const sig = crypto.createHmac('sha256', jwtSecret).update(unsigned).digest('base64url');
  return encryptToken(`${unsigned}.${sig}`, jwtEncryptSecret);
}

const tokenClaudio = buildToken({
  rut: '15656864-3',
  email: 'claudiogallardo1984@gmail.com',
  nombre_user: 'Claudio GALLARDO',
  id_user: 62,
  id_empresa: 9,
  roles: ['OPERADOR', 'GSP_OPERADOR']
});

function findBrowser() {
  for (const c of [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ]) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('No Chrome/Edge browser found');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { default: puppeteer } = await import(pathToFileURL(path.join(ROOT_DIR, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: 'new',
    defaultViewport: { width: 390, height: 844 },
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto(`${PWA_URL}/`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  const claudioUserStr = JSON.stringify({
    auth: true,
    id_user: 62,
    ID_USUARIO: 62,
    nombre_user: 'Claudio GALLARDO',
    email: 'claudiogallardo1984@gmail.com',
    id_empresa: 9,
    roles: ['OPERADOR', 'GSP_OPERADOR']
  });

  await page.evaluate((t, u) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('token', t);
    localStorage.setItem('user', u);
    localStorage.setItem('userDetail', u);
    localStorage.setItem('perfil', u);
  }, tokenClaudio, claudioUserStr);

  await page.goto(`${PWA_URL}/#/reportDiario?id_proyecto=203&id_equipo=36`, { waitUntil: 'domcontentloaded' });
  await sleep(4000);

  const reportStatus = await page.evaluate(() => {
    const text = document.body.innerText;
    const chips = Array.from(document.querySelectorAll('.v-chip')).map(c => c.innerText.trim());
    const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.placeholder, value: i.value }));
    return {
      chips,
      btns,
      inputs,
      sampleText: text.slice(0, 600)
    };
  });

  console.log('Report Diario Status:');
  console.log(JSON.stringify(reportStatus, null, 2));

  await browser.close();
}

main().catch(console.error);
