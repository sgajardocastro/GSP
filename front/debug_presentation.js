const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  const target = path.resolve(__dirname, '../antecedentes_reuniones/reuniones/20260709_preparación_cotización.html').replace(/\\/g, '/');
  await page.goto(`file:///${target}`, { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  await browser.close();
})().catch(err => console.error(err));
