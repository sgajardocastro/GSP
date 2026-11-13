const fs = require('fs');
const code = fs.readFileSync('ejecucion/frontend/dist_prod/assets/index-CowaIFh7.js', 'utf8');

const marker = 'Report Diario Digital';
const idx = code.indexOf(marker);
if (idx !== -1) {
  console.log('Found marker at index', idx);
  // Look backwards for setup or function definition
  const start = Math.max(0, idx - 1500);
  const end = Math.min(code.length, idx + 1000);
  console.log('Snippet:\n', code.slice(start, end));
} else {
  console.log('Marker not found');
}
