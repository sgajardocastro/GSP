const fs = require('fs');

const baseTorre = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = baseTorre.split('\n');

for (let i = 918; i < 940; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
