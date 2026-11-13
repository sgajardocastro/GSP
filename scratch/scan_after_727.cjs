const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');

const lines = base.split('\n');
for (let i = 728; i < lines.length; i++) {
  if (lines[i] && lines[i].includes('activeView ===')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
