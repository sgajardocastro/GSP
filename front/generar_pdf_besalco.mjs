import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('Starting PDF generation for Besalco...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  // Point to the LeanGlobal presentations directory
  const htmlPath = path.resolve('d:/SGajardo/Google Drive/Antigravity/LeanGlobal - Product/presentaciones/besalco_print.html').replace(/\\/g, '/');
  const fileUrl = `file:///${htmlPath}`;
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const pdfPath = path.resolve('d:/SGajardo/Google Drive/Antigravity/LeanGlobal - Product/presentaciones/Dossier Besalco - LeanGlobal IRL.pdf');
  console.log('Generating PDF at:', pdfPath);
  await page.pdf({
    path: pdfPath,
    format: 'letter',
    landscape: true,
    printBackground: true,
    margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
  });
  await browser.close();
  console.log('PDF generation complete!');
})().catch(err => {
  console.error('Error in PDF generation:', err);
  process.exit(1);
});
