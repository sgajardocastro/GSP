const fs = require('fs');

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
const lines = source.split('\n');

console.log('Lines 325 to 355:');
for (let i = 324; i < 355; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
