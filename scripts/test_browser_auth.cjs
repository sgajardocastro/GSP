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

async function main() {
  const puppeteer = await import('puppeteer-core');
  console.log('🚀 Iniciando Chrome visual en escritorio...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = (await browser.pages())[0] || await browser.newPage();

  console.log('🌐 Cargando login en ambiente DEV...');
  await page.goto('https://servidor.leanglobal.cl/lg-gsp-dev/login', { waitUntil: 'networkidle2' });

  console.log('🔑 Inyectando credenciales en localStorage...');
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, encToken, payloadUser);

  console.log('🌐 Navegando a CRM autenticado (WebHistory: /lg-gsp-dev/crm)...');
  await page.goto('https://servidor.leanglobal.cl/lg-gsp-dev/crm', { waitUntil: 'networkidle2' });

  console.log('Esperando montaje de componentes...');
  await new Promise(r => setTimeout(r, 4000));

  const urlActual = page.url();
  console.log('URL actual en pantalla:', urlActual);

  await page.screenshot({ path: 'evidencia_crm_visual.png' });
  console.log('📸 Captura de pantalla guardada en evidencia_crm_visual.png');

  if (urlActual.includes('login')) {
    console.error('❌ Redirigió a login');
  } else {
    console.log('✅ SESIÓN ACTIVA Y CRM DESBLOQUEADO EN PANTALLA VISUAL!');
  }

  // Dejar abierto unos segundos para confirmación
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
