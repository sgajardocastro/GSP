const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = currentTorre.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('totalCoincidenciasKanban')) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
