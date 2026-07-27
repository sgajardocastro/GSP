import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('Starting PDF generation from propuesta_formal.html...');
  
  // Launch browser in headless mode
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Configure high-resolution viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  const htmlPath = path.resolve(__dirname, 'propuesta_formal.html').replace(/\\/g, '/');
  const fileUrl = `file:///${htmlPath}`;
  console.log('Navigating to:', fileUrl);
  
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });
  
  // Wait a short time for Lucide icons and styles to render completely
  console.log('Waiting for assets and icons to render...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // PDF Output paths
  const pdfPath1 = path.resolve(__dirname, '../Propuestas/Propuesta Técnico-Comercial_ Sistema de Control de Gestión Operativa – Grúas San Pablo.pdf');
  
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
  const proposalsDir = path.dirname(pdfPath1);
  if (!fs.existsSync(proposalsDir)) {
    fs.mkdirSync(proposalsDir, { recursive: true });
  }

  // Generate first PDF
  try {
    console.log('Generating PDF 1 at:', pdfPath1);
    await page.pdf({ ...pdfOptions, path: pdfPath1 });
    console.log('PDF 1 created successfully.');
  } catch (err) {
    console.error('Error generating PDF 1:', err.message);
  }
  
  // Generate second PDF (try 20260702, fallback to 20260703 if busy)
  const pdfPath2_original = path.resolve(__dirname, '../Propuestas/Propuesta Técnico-Comercial_ Sistema de Control de Gestión Operativa-CRM  Grúas San Pablo - 20260702.pdf');
  const pdfPath2_today = path.resolve(__dirname, '../Propuestas/Propuesta Técnico-Comercial_ Sistema de Control de Gestión Operativa-CRM  Grúas San Pablo - 20260703.pdf');
  
  try {
    console.log('Generating PDF 2 at:', pdfPath2_original);
    await page.pdf({ ...pdfOptions, path: pdfPath2_original });
    console.log('PDF 2 created successfully.');
  } catch (err) {
    if (err.code === 'EBUSY' || err.message.includes('EBUSY') || err.message.includes('locked')) {
      console.warn('PDF 2 file was busy or locked. Falling back to today\'s date filename:', pdfPath2_today);
      await page.pdf({ ...pdfOptions, path: pdfPath2_today });
      console.log('PDF 2 with today\'s date created successfully.');
    } else {
      console.error('Error generating PDF 2:', err);
    }
  }
  
  await browser.close();
  console.log('PDF generation complete!');
})().catch(err => {
  console.error('Error in PDF generation script:', err);
  process.exit(1);
});
