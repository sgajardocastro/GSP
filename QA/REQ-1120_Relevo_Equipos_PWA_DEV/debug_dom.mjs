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

  await page.goto(`${BASE_URL}/crm?id=203&subtab=asignacion`, { waitUntil: 'domcontentloaded' });
  await sleep(4000);

  // 1. Seleccionar Rigger 22 en el select de Rigger
  console.log('Seleccionando Rigger 22 en DOM...');
  await page.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('table.tree-table tbody tr:first-child td:nth-child(3) select'));
    const selRig = sels.find(s => Array.from(s.options).some(o => o.text.includes('Rigger') || o.text.includes('ANDRES URRA')));
    if (selRig) {
      selRig.value = '22';
      selRig.dispatchEvent(new Event('input', { bubbles: true }));
      selRig.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(1000);

  // 2. Guardar Cambios
  console.log('Presionando 💾 Guardar Cambios...');
  const savePromise = page.waitForResponse(
    r => r.url().includes('/proyectos/203') && r.request().method() === 'PUT',
    { timeout: 15000 }
  );
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('GUARDAR CAMBIOS') || b.innerText.includes('Guardar Cambios'));
    if (btn) btn.click();
  });
  const resSave = await savePromise;
  console.log('Save status:', resSave.status());
  await sleep(3000);

  // 3. Confirmar Asignación OT
  console.log('Presionando Confirmar Asignación OT ➔ Preparación Salida...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btnConf = btns.find(b => (b.innerText || '').toLowerCase().includes('confirmar asignación'));
    if (btnConf) btnConf.click();
  });
  await sleep(5000);

  // 4. Ver estado de tabs
  const tabsStatus = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
    return btns.filter(b => b.includes('Control de Flota') || b.includes('VALORIZACIÓN') || b.includes('Reportes'));
  });
  console.log('Tabs status after confirmation:', tabsStatus);

  await browser.close();
}

main().catch(console.error);
