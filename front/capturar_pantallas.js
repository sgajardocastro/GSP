const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  // Ensure assets directory exists
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('Created assets directory:', assetsDir);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Set high-density desktop viewport
  await page.setViewport({ width: 1440, height: 900 });

  // Navigate to local file URI
  const absolutePath = path.resolve(__dirname, 'maqueta_gsp_final.html').replace(/\\/g, '/');
  const fileUrl = `file:///${absolutePath}`;
  console.log('Loading local HTML:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });

  // Wait for Highcharts and Leaflet to animate and load
  console.log('Waiting for charts and map to render (3s)...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 1. Capture Dashboard
  console.log('Capturing KPI Dashboard...');
  await page.screenshot({ path: path.join(assetsDir, 'kpi_dashboard.png') });

  // 2. Switch to Kanban Torre and capture
  console.log('Switching to Torre de Control view...');
  await page.evaluate(() => {
    window.switchView('torre', document.querySelector('[data-view=torre]'));
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.screenshot({ path: path.join(assetsDir, 'kanban_torre.png') });

  // 3. Open Modal 360 and capture
  console.log('Opening Modal 360 for #SRV-2026-051...');
  await page.evaluate(() => {
    window.openModal('#SRV-2026-051');
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.screenshot({ path: path.join(assetsDir, 'modal_360.png') });

  // Close the modal via evaluate to clean up the screen state
  await page.evaluate(() => {
    document.getElementById('modal-360').classList.add('hidden');
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  // 4. Switch to Operator Mobile view and capture
  console.log('Switching to Operator Mobile view...');
  await page.evaluate(() => {
    window.switchRole('operador');
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.screenshot({ path: path.join(assetsDir, 'app_mobile.png') });

  console.log('Closing browser...');
  await browser.close();
  console.log('All screenshots captured successfully in:', assetsDir);
})().catch(err => {
  console.error('Error running screenshot capture:', err);
  process.exit(1);
});
