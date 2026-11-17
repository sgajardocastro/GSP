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

const payloadOperador = {
  rut: '12345678-5',
  email: 'hフレdes@leanglobal.cl',
  nombre: 'Héctor Paredes',
  id_user: 34,
  id_empresa: 9,
  flag_proc_enrol: false,
  roles: ['OPERADOR', 'CONDUCTOR']
};

const token = jwt.sign(payloadOperador, jwtSecret, { expiresIn: '24h' });
const encToken = encryptToken(token, jwtEncryptSecret);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const puppeteer = await import('puppeteer-core');
  console.log('🚀 [PWA GUI] Iniciando Google Chrome en emulación móvil (Samsung Galaxy / iPhone)...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    defaultViewport: {
      width: 412,
      height: 915,
      isMobile: true,
      hasTouch: true
    },
    args: ['--window-size=430,960', '--no-sandbox']
  });

  const page = (await browser.pages())[0] || await browser.newPage();

  console.log('🔑 [PWA GUI] Inyectando sesión del chofer/operador en PWA DEV...');
  await page.goto('https://servidor.leanglobal.cl/pwa-gsp-dev/', { waitUntil: 'networkidle2' });
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('perfil', JSON.stringify({
      ID_USUARIO: 34,
      NOMBRE: 'Héctor Paredes',
      NOMBRE_ROL: 'OPERADOR',
      auth: true
    }));
  }, encToken, payloadOperador);

  // Navegar a Hoja de Ruta / Viaje Conductor del Proyecto 94 (Grúa 70T)
  console.log('🚛 [PWA GUI] Abriendo Portal del Conductor / Desplazamiento (Token: vj-lean-94-70t)...');
  await page.goto('https://servidor.leanglobal.cl/pwa-gsp-dev/#/viaje/vj-lean-94-70t', { waitUntil: 'networkidle2' });
  await sleep(4000);

  await page.screenshot({ path: 'evidencia_06_pwa_viaje_conductor.png' });
  console.log('📸 Captura 6 guardada: evidencia_06_pwa_viaje_conductor.png');

  // Navegar a Report Diario de Izaje de Faena
  console.log('📋 [PWA GUI] Abriendo Formulario Oficial de Report Diario de Izaje...');
  await page.goto('https://servidor.leanglobal.cl/pwa-gsp-dev/#/reportDiario?id_proyecto=94&id_equipo=42', { waitUntil: 'networkidle2' });
  await sleep(4000);

  await page.screenshot({ path: 'evidencia_07_pwa_report_diario.png' });
  console.log('📸 Captura 7 guardada: evidencia_07_pwa_report_diario.png');

  console.log('⏳ Manteniendo PWA visible en pantalla 6 segundos...');
  await sleep(6000);

  await browser.close();
  console.log('🎉 [PWA GUI] Pruebas visuales en PWA completadas con éxito!');
}

main().catch(err => {
  console.error('❌ Error en ejecución PWA GUI:', err);
  process.exit(1);
});
