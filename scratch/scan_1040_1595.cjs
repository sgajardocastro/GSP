const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');

const lines = base.split('\n');
for (let i = 1040; i < 1595; i++) {
  if (lines[i] && (lines[i].includes('<!--') || lines[i].includes('<div v-') || lines[i].includes('pmo'))) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
