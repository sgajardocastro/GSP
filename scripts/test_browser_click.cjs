const puppeteer = require('d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/node_modules/puppeteer-core');

async function test() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER PAGEERROR]:`, err);
  });

  console.log('Navigating to lg-gsp-prod...');
  await page.goto('https://servidor.leanglobal.cl/lg-gsp-prod/', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('Page loaded. URL:', page.url());

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));

  // Check what's on screen
  const title = await page.title();
  console.log('Page title:', title);

  // Take screenshot
  await page.screenshot({ path: 'scripts/browser_view.png' });
  console.log('Screenshot saved to scripts/browser_view.png');

  await browser.close();
}

test().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
