const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = currentTorre.split('\n');
console.log('Lines 120 to 135 of currentTorre:');
for (let i = 119; i < 135; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
