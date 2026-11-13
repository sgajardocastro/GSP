const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');

const lines = currentTorre.split('\n');
console.log('Lines 85 to 125 of currentTorre:');
for (let i = 84; i < 125; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
