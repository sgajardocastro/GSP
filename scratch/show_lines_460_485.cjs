const fs = require('fs');

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
const lines = source.split('\n');

console.log('Lines 460 to 485:');
for (let i = 459; i < 485; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
