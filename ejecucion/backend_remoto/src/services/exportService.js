const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const { TRANSMAC_DOCS_DIR } = require('../config/docsConfig');

function resolveBaseWebUrl() {
  const raw = String(process.env.BASE_URL || 'https://servidor.leanglobal.cl/lg-gsp-dev').trim();
  return raw.replace(/\/+$/, '');
}

async function generarPDF(idInspeccion) {
  if (!idInspeccion) throw new Error('Falta idInspeccion');

  console.log(`🔍 Generando PDF para idInspeccion=${idInspeccion}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-application-cache',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const page = await browser.newPage();

  // 🔒 Deshabilitar caché por si hay SW/HTTP cache
  await page.setCacheEnabled(false);
  const cdp = await page.target().createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  // 🚫 Headers para evitar caché intermedia
  await page.setExtraHTTPHeaders({
    'Cache-Control': 'no-cache, no-store, max-age=0',
    Pragma: 'no-cache',
  });

  // 🧭 URL con cache-buster
  const baseWebUrl = resolveBaseWebUrl();
  console.log("--------------------------------------------------");
  console.log(`🌐 BASE_URL: ${baseWebUrl}`);
  console.log("--------------------------------------------------");
  const baseUrl = `${baseWebUrl}/versurveyprint?idInspeccion=${idInspeccion}`;
  
  const url = `${baseUrl}&_=${Date.now()}`;
  console.log(`🌐 Navegando a: ${url}`);


  // (Opcional) esperar la API específica que llena la vista
  // Ajusta este regex a tu endpoint real si lo tienes:
  const apiRegex = /\/api\/.*(survey|inspeccion).*\/detail/i;

  // Ir a la página
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90_000 });

  // ♻️ Reload forzado para romper cualquier caché del SW de la primera carga
  await page.reload({ waitUntil: 'networkidle0', timeout: 90_000 });

  // 🖨️ Usar estilos de impresión
  if (page.emulateMediaType) await page.emulateMediaType('print');

  // ✅ Espera robusta (elige una de las dos, idealmente AMBAS si puedes):
  // A) Esperar respuesta de la API que completa la vista (ajusta apiRegex)
  const waitApi = page.waitForResponse(
    res =>
      apiRegex.test(res.url()) &&
      res.request().method() === 'GET' &&
      res.status() === 200,
    { timeout: 20_000 }
  ).catch(() => null); // no romper si no existe

  // B) Esperar un selector del DOM que indique que todo está renderizado (AJUSTA!!)
  const waitDom = page.waitForSelector('#pdf-ready, .contenedor-impresion, .pagina-a4', {
    visible: true,
    timeout: 30_000,
  }).catch(() => null);

  await Promise.race([
    Promise.allSettled([waitApi, waitDom]).then(() => true),
    page.waitForTimeout(5_000), // fallback leve para no quedar colgado
  ]);

  // Pequeño settle para fuentes/estilos diferidos
  await page.waitForTimeout(500);

  // 🗓️ Nombre de archivo con timestamp
  const now = new Date();
  const fecha = now.toISOString().split('T')[0].replace(/-/g, '');
  const hora = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const timestamp = `${fecha}_${hora}`;

  await fs.mkdir(TRANSMAC_DOCS_DIR, { recursive: true });

  const nombreArchivo = path.join(
    TRANSMAC_DOCS_DIR,
    `${idInspeccion}-${timestamp}.pdf`
  );

  console.log(`💾 Guardando PDF en: ${nombreArchivo}`);
  await page.pdf({
    path: nombreArchivo,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  console.log(`✅ PDF generado: ${nombreArchivo}`);
  return nombreArchivo;
}

async function generarPDFDesdeHtml(htmlContent, filename) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    const page = await browser.newPage();
    
    // Establecer contenido y esperar a que las imágenes (logo) carguen
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const filePath = path.join(os.tmpdir(), filename);
    await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });
    
    await browser.close();
    return filePath;
}

module.exports = { generarPDF, generarPDFDesdeHtml };
