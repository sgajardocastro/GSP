const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = currentTorre.split('\n');
console.log('Lines 700 to 715 of currentTorre:');
for (let i = 699; i < 715; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
