import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Listen to browser console and errors
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error('[BROWSER PAGE ERROR]', err);
  });
  page.on('requestfailed', request => {
    console.warn(`[BROWSER REQ FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  const absolutePath = path.resolve(__dirname, 'maqueta_gsp_final.html').replace(/\\/g, '/');
  const fileUrl = `file:///${absolutePath}`;
  console.log('Loading local HTML:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });

  console.log('Waiting for charts and map to render (5s)...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 1. Capture Dashboard
  console.log('Capturing KPI Dashboard...');
  await page.screenshot({ path: path.join(assetsDir, 'kpi_dashboard.png') });

  // 2. Switch to Kanban Torre and capture
  console.log('Switching to Torre de Control view...');
  await page.evaluate(() => {
    window.switchView('torre', document.querySelector('[data-view=torre]'));
  });
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ path: path.join(assetsDir, 'kanban_torre.png') });

  // 2b. Switch to Torre - Mapa and capture
  console.log('Switching to Torre de Control - Mapa...');
  await page.evaluate(() => {
    window.switchTorreTab('mapa');
  });
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ path: path.join(assetsDir, 'torre_mapa.png') });

  // 2c. Switch to Torre - Gantt and capture
  console.log('Switching to Torre de Control - Gantt...');
  await page.evaluate(() => {
    window.switchTorreTab('gantt');
  });
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ path: path.join(assetsDir, 'torre_gantt.png') });

  // Restore Torre to Kanban state
  await page.evaluate(() => {
    window.switchTorreTab('kanban');
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  // 3. Open Modal 360 (Expediente) -> Switch to "Ingeniería & Site Visit" -> Capture cropped modal
  console.log('Opening Modal 360 and switching to Ingeniería...');
  await page.evaluate(() => {
    window.openModal('#SRV-2026-051');
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.evaluate(() => {
    window.switchDossierTab('ingenieria');
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const modal360El = await page.$('#modal-360 .modal-content');
  if (modal360El) {
    await modal360El.screenshot({ path: path.join(assetsDir, 'modal_360.png') });
  }

  // Close the modal
  await page.evaluate(() => {
    window.closeModal();
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  // 4. Switch to CRM Clientes -> Open Opportunity Form for CMPC Celulosa -> Capture cropped drawer
  console.log('Opening CRM Clientes and launching Opportunity Gestor...');
  await page.evaluate(() => {
    window.switchView('clientes', document.querySelector('[data-view=clientes]'));
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.evaluate(() => {
    window.initGestorOportunidades('COT-2026-012', 'cmpc-celulosa');
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const crmDrawerEl = await page.$('#view-gestor-oportunidades .modal-content');
  if (crmDrawerEl) {
    await crmDrawerEl.screenshot({ path: path.join(assetsDir, 'crm_clientes.png') });
  }

  // Close the CRM drawer
  await page.evaluate(() => {
    document.getElementById('view-gestor-oportunidades').classList.remove('open');
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  // 4b. Switch to Gestor Documental (File Tree) -> Capture full view
  console.log('Switching to Gestor Documental view...');
  await page.evaluate(() => {
    window.switchView('documentos', document.querySelector('[data-view=documentos]'));
  });
  await new Promise(resolve => setTimeout(resolve, 2000));
  await page.screenshot({ path: path.join(assetsDir, 'gestor_documental.png') });

  // 5. Open Fleet View -> Open Crane Ficha for Liebherr LTM 1400 (GZBC-71) -> Capture cropped crane ficha
  console.log('Opening Fleet View and launching Crane Ficha GZBC-71...');
  await page.evaluate(() => {
    window.switchView('mantencion', document.querySelector('[data-view=mantencion]'));
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.evaluate(() => {
    window.openFichaEquipo('GZBC-71');
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const craneModalEl = await page.$('#modal-ficha-equipo .modal-content');
  if (craneModalEl) {
    await craneModalEl.screenshot({ path: path.join(assetsDir, 'ficha_grua.png') });
  }

  // Close crane modal
  await page.evaluate(() => {
    window.closeFichaEquipo();
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  // 6. Switch role to Operador Mobile -> Show Mobile Inbox -> Capture cropped mobile frame
  console.log('Switching to mobile view - Inbox...');
  await page.evaluate(() => {
    window.switchRole('operador');
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.evaluate(() => {
    window.showMobileInbox();
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const mobileInboxEl = await page.$('#mobile-view .mobile-frame');
  if (mobileInboxEl) {
    await mobileInboxEl.screenshot({ path: path.join(assetsDir, 'app_mobile_inbox.png') });
  }

  // 7. Switch to Mobile Form (Checklist / AST) -> Capture cropped mobile frame
  console.log('Switching to mobile view - Active Form...');
  await page.evaluate(() => {
    window.openMobileService('#SRV-2026-041');
  });
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.evaluate(() => {
    window.openMobileForm();
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const mobileFormEl = await page.$('#mobile-view .mobile-frame');
  if (mobileFormEl) {
    await mobileFormEl.screenshot({ path: path.join(assetsDir, 'app_mobile_form.png') });
  }

  console.log('Closing browser...');
  await browser.close();
  console.log('All screenshots captured successfully!');
})().catch(err => {
  console.error('Error running screenshot capture:', err);
  process.exit(1);
});
