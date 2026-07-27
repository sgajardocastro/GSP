import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('Starting PDF generation from adendum_gsp.html...');
  
  // Launch browser in headless mode
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Configure high-resolution viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  const htmlPath = path.resolve(__dirname, 'adendum_gsp.html').replace(/\\/g, '/');
  const fileUrl = `file:///${htmlPath}`;
  console.log('Navigating to:', fileUrl);
  
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });
  
  // Wait a short time for Lucide icons and styles to render completely
  console.log('Waiting for assets and icons to render...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // PDF Output path
  const pdfPath = path.resolve(__dirname, '../Propuestas/Adendum Técnico-Comercial_ Ecosistema Control Operativo y Finanzas – Grúas San Pablo.pdf');
  
  const pdfOptions = {
    format: 'letter',
    landscape: true,
    printBackground: true,
    margin: {
      top: '0px',
      bottom: '0px',
      left: '0px',
      right: '0px'
    }
  };
  
  // Ensure the output directory exists
  const proposalsDir = path.dirname(pdfPath);
  if (!fs.existsSync(proposalsDir)) {
    fs.mkdirSync(proposalsDir, { recursive: true });
  }

  // Generate PDF
  try {
    console.log('Generating PDF at:', pdfPath);
    await page.pdf({ ...pdfOptions, path: pdfPath });
    console.log('PDF Adendum created successfully at:', pdfPath);
  } catch (err) {
    console.error('Error generating PDF:', err.message);
  }
  
  await browser.close();
  console.log('PDF Adendum generation complete!');
})().catch(err => {
  console.error('Error in PDF generation script:', err);
  process.exit(1);
});
