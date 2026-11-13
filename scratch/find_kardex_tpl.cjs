const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');
const lines = base.split('\n');

for (let i = 0; i < 2500; i++) {
  if (lines[i] && lines[i].includes('kardex')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
