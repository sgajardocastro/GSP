const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');

const lines = base.split('\n');
for (let i = 700; i < 1500; i++) {
  if (lines[i] && (lines[i].includes('activeView ===') || lines[i].includes('VISTA') || lines[i].includes('kardex'))) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
