const path = require('path');
const jwt = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/jsonwebtoken'));
const crypto = require('crypto');

const jwtSecret = 'secret';
const jwtEncryptSecret = 'encrypt-secret';

function encryptToken(token, secret) {
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(secret, 'salt', 32), Buffer.alloc(16, 0));
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

const payloadUser = {
  rut: '9161957-1',
  email: 'sgajardoc@gmail.com',
  nombre: 'Sergio Gajardo',
  id_user: 55,
  id_empresa: 9,
  flag_proc_enrol: false,
  roles: ['ADMINISTRADOR', 'OPERACIONES_ADMIN', 'COMERCIAL_ADMIN']
};

const token = jwt.sign(payloadUser, jwtSecret, { expiresIn: '24h' });
const encToken = encryptToken(token, jwtEncryptSecret);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const puppeteer = await import('puppeteer-core');
  console.log('🚀 [E2E GUI] Iniciando Google Chrome en pantalla visual...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = (await browser.pages())[0] || await browser.newPage();

  // Paso 1: Autenticación e inyección en dominio DEV
  console.log('🔑 [E2E GUI] Cargando entorno DEV e inyectando credenciales...');
  await page.goto('https://servidor.leanglobal.cl/lg-gsp-dev/login', { waitUntil: 'networkidle2' });
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, encToken, payloadUser);

  // Paso 2: Navegar a la pantalla de CRM
  console.log('🌐 [E2E GUI] Navegando a Gestor de Oportunidades & Cotizaciones...');
  await page.goto('https://servidor.leanglobal.cl/lg-gsp-dev/crm', { waitUntil: 'networkidle2' });
  await sleep(3000);

  // Captura pantalla CRM inicial
  await page.screenshot({ path: 'evidencia_01_crm_abierto.png' });
  console.log('📸 Captura 1 guardada: evidencia_01_crm_abierto.png');

  // Paso 3: Interactuar con el buscador de clientes mandantes
  console.log('🔍 [E2E GUI] Buscando cliente "LeanGlobal" en el formulario...');
  const searchInputSelector = 'input[name="crm_q_search_mandante"]';
  await page.waitForSelector(searchInputSelector, { timeout: 10000 });
  await page.click(searchInputSelector, { clickCount: 3 });
  await page.type(searchInputSelector, 'LeanGlobal', { delay: 100 });
  await sleep(1500);

  // Clic en el resultado del cliente en el dropdown
  console.log('👆 [E2E GUI] Seleccionando "LeanGlobal Spa" en el desplegable...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div'));
    const item = items.find(el => el.textContent.includes('LeanGlobal Spa') || el.textContent.includes('78249226'));
    if (item) item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  await sleep(2000);

  await page.screenshot({ path: 'evidencia_02_cliente_seleccionado.png' });
  console.log('📸 Captura 2 guardada: evidencia_02_cliente_seleccionado.png');

  // Paso 4: Cambiar a la pestaña "Estructurador de Servicios"
  console.log('📑 [E2E GUI] Cambiando a pestaña Estructurador de Servicios...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnEst = buttons.find(b => b.textContent.includes('Estructurador de Servicios'));
    if (btnEst) btnEst.click();
  });
  await sleep(1500);

  // Activar modo Árbol si está en clásico
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnArbol = buttons.find(b => b.textContent.includes('Árbol por Servicios'));
    if (btnArbol) btnArbol.click();
  });
  await sleep(1500);

  await page.screenshot({ path: 'evidencia_03_pestana_cotizacion.png' });
  console.log('📸 Captura 3 guardada: evidencia_03_pestana_cotizacion.png');

  // Paso 5: Click en "+ Izaje" en el Estructurador de Servicios
  console.log('⚡ [E2E GUI] Haciendo click en botón "+ Izaje" para crear Servicio 1...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnIzaje = buttons.find(b => b.textContent.includes('+ Izaje') || b.textContent.includes('Izaje'));
    if (btnIzaje) btnIzaje.click();
  });
  await sleep(2000);

  await page.screenshot({ path: 'evidencia_04_servicio_1_creado.png' });
  console.log('📸 Captura 4 guardada: evidencia_04_servicio_1_creado.png');

  // Paso 6: Segundo click en "+ Izaje" para Servicio 2 (Camión Pluma)
  console.log('⚡ [E2E GUI] Haciendo click en botón "+ Izaje" para crear Servicio 2...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnIzaje = buttons.find(b => b.textContent.includes('+ Izaje') || b.textContent.includes('Izaje'));
    if (btnIzaje) btnIzaje.click();
  });
  await sleep(2000);

  await page.screenshot({ path: 'evidencia_05_servicio_2_creado.png' });
  console.log('📸 Captura 5 guardada: evidencia_05_servicio_2_creado.png');

  console.log('⏳ Manteniendo ventana abierta 8 segundos para visualización del usuario...');
  await sleep(8000);

  await browser.close();
  console.log('🎉 [E2E GUI] Ejecución visual en Chrome completada con éxito!');
}

main().catch(err => {
  console.error('❌ Error en ejecución GUI:', err);
  process.exit(1);
});
