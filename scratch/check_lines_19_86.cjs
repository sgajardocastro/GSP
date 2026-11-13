const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = currentTorre.split('\n');

console.log('Lines 18 to 86 of currentTorre:');
for (let i = 18; i < 86; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
