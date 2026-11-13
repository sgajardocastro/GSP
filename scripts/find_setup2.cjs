const fs = require('fs');
const code = fs.readFileSync('ejecucion/frontend/dist_prod/assets/index-CowaIFh7.js', 'utf8');

const marker = 'Report Diario Digital';
const idx = code.indexOf(marker);

// Search backwards for setup(
const setupIdx = code.lastIndexOf('setup(', idx);
console.log('setupIdx:', setupIdx);
if (setupIdx !== -1) {
  console.log('Setup header:', code.slice(setupIdx, setupIdx + 200));
}
