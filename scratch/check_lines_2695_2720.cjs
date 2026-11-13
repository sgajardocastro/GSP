const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = currentTorre.split('\n');

for (let i = 2694; i < 2720; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
