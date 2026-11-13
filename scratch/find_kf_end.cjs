const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');
const lines = base.split('\n');

for (let i = 720; i < 1100; i++) {
  if (lines[i] && (lines[i].includes('<!-- ===') || lines[i].includes('v-else-if="activeView'))) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
