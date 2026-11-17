import { pathToFileURL } from 'url';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const { default: puppeteer } = await import(pathToFileURL(path.join(ROOT_DIR, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);

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

const tokenAdmin = buildToken({
  rut: '12345678-9',
  email: 'sgajardoc@gmail.com',
  nombre_user: 'Sergio Gajardo',
  id_user: 55,
  id_empresa: 9,
  roles: ['ADMIN']
});

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});

const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1050 });

// Inyectar antes de cualquier carga
await page.evaluateOnNewDocument((t, u) => {
  localStorage.setItem('token', t);
  localStorage.setItem('user', u);
  localStorage.setItem('gsp_cotizador_modo', 'arbol');
}, tokenAdmin, JSON.stringify({
  id_user: 55, email: 'sgajardoc@gmail.com', nombre_user: 'Sergio Gajardo', id_empresa: 9, roles: ['ADMIN']
}));

console.log('Navegando a CRM...');
await page.goto('https://servidor.leanglobal.cl/lg-gsp-dev/crm', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 4000));

console.log('URL actual en navegador:', page.url());
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
});
console.log('Total botones encontrados:', buttons.length);
console.log('TODOS los botones:', buttons);

console.log('Probando seleccion de cliente en pantalla...');
await page.focus('input[name="crm_q_search_mandante"]');
await page.keyboard.type('METTCO', { delay: 100 });
await new Promise(r => setTimeout(r, 800));

const dropdownVisible = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('.scrollbar-hide div, .absolute div')).filter(d => d.innerText && d.innerText.includes('METTCO'));
  return {
    count: items.length,
    primerTexto: items[0]?.innerText
  };
});
console.log('Dropdown de clientes:', dropdownVisible);

console.log('Haciendo clic en la opcion de METTCO en el dropdown...');
await page.evaluate(() => {
  const item = document.querySelector('div[class*="hover:bg-amber-500"]');
  if (item) {
    console.log('Item clickeable encontrado:', item.innerText);
    item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    item.click();
  } else {
    console.error('No se encontro div[class*="hover:bg-amber-500"]');
  }
});
await new Promise(r => setTimeout(r, 600));

const clienteSeleccionadoCheck = await page.evaluate(() => {
  const cardCliente = document.querySelector('div.bg-white\\/5')?.innerText || 'no card';
  const rutVal = document.querySelector('input[placeholder="RUT para asociar..."]')?.value || '';
  return { cardCliente, rutVal };
});
console.log('Resultado seleccion cliente:', clienteSeleccionadoCheck);
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const btnEst = btns.find(b => b.innerText.includes('ESTRUCTURADOR DE SERVICIOS'));
  if (btnEst) btnEst.click();
});
await new Promise(r => setTimeout(r, 1000));

const buttonsAfter = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
});
console.log('Botones despues de hacer clic en ESTRUCTURADOR:', buttonsAfter);

const estructuradorVisible = await page.evaluate(() => {
  return {
    tieneEstructurador: !!document.querySelector('.surface-card'),
    htmlEstructurador: document.querySelector('.surface-card')?.innerText || 'No surface-card',
    modoEstructuradorText: document.querySelector('.combo-popover, [title*=\"Izaje\"]')?.innerText || 'No popover'
  };
});
console.log('Estructurador visible:', estructuradorVisible);

console.log('Haciendo clic en "+ Izaje"...');
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const btnIzaje = btns.find(b => b.innerText.trim() === '+ Izaje');
  if (btnIzaje) btnIzaje.click();
});
await new Promise(r => setTimeout(r, 1000));

const cardContent = await page.evaluate(() => {
  const card = document.querySelector('.tree-service-card, .surface-card');
  return {
    encontrado: !!card,
    text: card?.innerText?.slice(0, 400),
    botones: Array.from(card?.querySelectorAll('button') || []).map(b => b.innerText.trim())
  };
});
console.log('Resultado clic en + Izaje:', cardContent);

console.log('Buscando boton "+ Agregar item..." en la tarjeta de servicio...');
const btnAddInfo = await page.evaluate(() => {
  const btn = document.querySelector('.tree-add-branch-btn');
  return {
    existe: !!btn,
    texto: btn?.innerText,
    clases: btn?.className
  };
});
console.log('Boton + Agregar item:', btnAddInfo);

if (btnAddInfo.existe) {
  console.log('Haciendo clic en "+ Agregar item..."...');
  await page.evaluate(() => {
    document.querySelector('.tree-add-branch-btn').click();
  });
  await new Promise(r => setTimeout(r, 600));

  const popoverInfo = await page.evaluate(() => {
    const pop = document.querySelector('.combo-popover');
    return {
      visible: !!pop,
      items: Array.from(pop?.querySelectorAll('button') || []).map(b => b.innerText.trim())
    };
  });
  console.log('Popover de ramas desplegado:', popoverInfo);

  console.log('Seleccionando "Traslado"...');
  await page.evaluate(() => {
    const pop = document.querySelector('.combo-popover');
    const btn = Array.from(pop?.querySelectorAll('button') || []).find(b => b.innerText.includes('Traslado'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Volver a abrir para agregar Rigger
  await page.evaluate(() => {
    document.querySelector('.tree-add-branch-btn').click();
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Seleccionando "Personal (Rigger / Operador)"...');
  await page.evaluate(() => {
    const pop = document.querySelector('.combo-popover');
    const btn = Array.from(pop?.querySelectorAll('button') || []).find(b => b.innerText.includes('Personal'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const resumenTree = await page.evaluate(() => {
    const resume = document.querySelector('.surface-card')?.innerText;
    return resume;
  });
  console.log('RESUMEN DEL ARBOL LUEGO DE AGREGAR RAMAS:\n', resumenTree);
  // Hacer clic en GUARDAR EN PREVENTA
  console.log('Haciendo clic en GUARDAR EN PREVENTA...');
  page.on('dialog', async (d) => {
    console.log('DIALOG DE ALERTA AL GUARDAR:', d.message());
    await d.accept();
  });

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('GUARDAR EN PREVENTA'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
}

await page.screenshot({ path: 'QA/inspect_page.png' });
console.log('Captura guardada en QA/inspect_page.png');
await browser.close();
