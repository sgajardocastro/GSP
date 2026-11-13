const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = currentTorre.split('\n');
console.log('Lines 3820 to 3860 of currentTorre:');
for (let i = 3819; i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
