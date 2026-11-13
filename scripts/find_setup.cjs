const fs = require('fs');
const code = fs.readFileSync('ejecucion/frontend/dist_prod/assets/index-CowaIFh7.js', 'utf8');

const marker = 'Report Diario Digital';
const idx = code.indexOf(marker);

// Find setup function start before this
// Usually `const ... = { __name: 'ModalVisorReport', props: ... setup(t, { emit: ... })`
const before = code.slice(Math.max(0, idx - 5000), idx);
console.log('--- BEFORE (5000 chars) ---');
// Search for `__name:"ModalVisorReport"` or similar
const nameIdx = before.lastIndexOf('ModalVisorReport');
if (nameIdx !== -1) {
  console.log('Found ModalVisorReport in before at offset', nameIdx);
  console.log(before.slice(nameIdx - 100, nameIdx + 800));
} else {
  console.log('ModalVisorReport not found in before');
  // Just print last 1000 chars of before
  console.log(before.slice(-1000));
}
