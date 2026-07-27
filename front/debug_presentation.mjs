import puppeteer from 'puppeteer';
import pathModule from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  const target = pathModule.resolve(__dirname, '../antecedentes_reuniones/reuniones/20260709_preparación_cotización.html').replace(/\\/g, '/');
  
  console.log("Loading page...");
  page.setDefaultNavigationTimeout(0);
  await page.goto(`file:///${target}`, { waitUntil: 'domcontentloaded' });
  
  console.log("Waiting 5s for scripts to run...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const status = await page.evaluate(() => {
    return {
      highchartsDefined: typeof Highcharts !== 'undefined',
      containerExists: !!document.getElementById('highcharts-container'),
      chartRendered: document.getElementById('highcharts-container') && document.getElementById('highcharts-container').children.length > 0,
      containerHtml: document.getElementById('highcharts-container') ? document.getElementById('highcharts-container').innerHTML : 'no container'
    };
  });
  console.log("STATUS:", status);
  
  await browser.close();
})().catch(err => console.error("Error:", err));
