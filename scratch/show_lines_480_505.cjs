const fs = require('fs');

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
const lines = source.split('\n');

console.log('Lines 480 to 505:');
for (let i = 479; i < 505; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
