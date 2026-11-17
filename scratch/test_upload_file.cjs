const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

async function testUpload() {
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
        <input id="foto" type="file" />
        <div id="output">esperando</div>
        <script>
          document.getElementById('foto').addEventListener('change', (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
              document.getElementById('output').innerText = 'cargado ' + file.name + ' ' + reader.result.slice(0, 30);
            };
            reader.readAsDataURL(file);
          });
        </script>
      </body>
    </html>
  `);

  const dummyPath = path.resolve('QA/REQ-1120_Relevo_Equipos_PWA_DEV/dummy_horometro.png');
  const input = await page.$('#foto');
  await input.uploadFile(dummyPath);
  
  // Check if change fired automatically
  await new Promise(r => setTimeout(r, 500));
  let txt = await page.$eval('#output', el => el.innerText);
  console.log('Without explicit dispatch:', txt);

  // Now dispatch change explicitly
  await page.$eval('#foto', el => el.dispatchEvent(new Event('change', { bubbles: true })));
  await new Promise(r => setTimeout(r, 500));
  txt = await page.$eval('#output', el => el.innerText);
  console.log('With explicit dispatch:', txt);

  await browser.close();
}

testUpload().catch(console.error);
