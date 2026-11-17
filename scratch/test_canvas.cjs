const path = require('path');
const { pathToFileURL } = require('url');

async function testCanvas() {
  const { default: puppeteer } = await import(pathToFileURL(path.resolve('./node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <canvas id="c" width="300" height="150" style="border:1px solid black"></canvas>
        <div id="status">vacio</div>
        <script>
          const c = document.getElementById('c');
          let drawing = false;
          c.addEventListener('mousedown', () => { drawing = true; });
          c.addEventListener('mouseup', () => {
            if (drawing) {
              drawing = false;
              document.getElementById('status').innerText = 'firmado: ' + c.toDataURL('image/png').slice(0, 30);
            }
          });
        </script>
      </body>
    </html>
  `);

  // Emulate mobile viewport WITHOUT hasTouch: true
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: false });
  
  const box = await (await page.$('#c')).boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 80);
  await page.mouse.up();
  
  const status = await page.$eval('#status', el => el.innerText);
  console.log('Status with hasTouch: false ->', status);

  await browser.close();
}

testCanvas().catch(console.error);
