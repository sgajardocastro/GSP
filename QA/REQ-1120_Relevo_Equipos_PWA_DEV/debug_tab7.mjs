import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const BASE_URL = 'https://servidor.leanglobal.cl/lg-gsp-dev';
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

const tokenAdmin = buildToken({ rut: '12345678-9', email: 'sgajardoc@gmail.com', nombre_user: 'Sergio Gajardo', id_user: 55, id_empresa: 9, roles: ['ADMIN'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { default: puppeteer } = await import(pathToFileURL(path.join(ROOT_DIR, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1600, height: 1050 },
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  page.on('dialog', async d => {
    console.log('[DIALOG]', d.type(), d.message().slice(0, 95));
    await d.accept();
  });

  await page.evaluateOnNewDocument((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', u);
    localStorage.setItem('gsp_cotizador_modo', 'arbol');
  }, tokenAdmin, JSON.stringify({ id_user: 55, email: 'sgajardoc@gmail.com', nombre_user: 'Sergio Gajardo', id_empresa: 9, roles: ['ADMIN'] }));

  // Navegar a Pestaña 7 paso EDP
  console.log('Navegando a Pestaña 7 (subtab=liquidacion&paso=edp)...');
  await page.goto(`${BASE_URL}/crm?id=203&subtab=liquidacion&paso=edp`, { waitUntil: 'domcontentloaded' });
  await sleep(4000);

  // Click en Abrir Carátula EDP / Firmar
  console.log('Clicking button to open Modal Carátula EDP...');
  const clickEdp = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => (b.innerText || '').toLowerCase().includes('carátula edp') || (b.innerText || '').toLowerCase().includes('caratula edp'));
    if (btn) {
      btn.click();
      return { ok: true, text: btn.innerText.trim() };
    }
    return { ok: false, allBtns: btns.map(b => b.innerText.trim()).filter(Boolean) };
  });
  console.log('Click abrir Carátula EDP:', clickEdp);
  await sleep(3000);

  // Ver si el modal de Carátula EDP está abierto y auditar datos
  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.z-50') || document.querySelector('[role="dialog"]') || document.querySelector('.bg-black\\/80');
    return {
      hasModal: Boolean(modal),
      title: document.querySelector('h2, h3')?.innerText,
      modalTextSnippet: modal ? modal.innerText.slice(0, 500) : null
    };
  });
  console.log('Modal status:', JSON.stringify(modalInfo, null, 2));

  await browser.close();
}

main().catch(console.error);
