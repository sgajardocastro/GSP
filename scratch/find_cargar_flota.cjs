const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');

const lines = base.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('cargarFlota') || l.includes('activeView.value')) {
    console.log(`Line ${idx + 1}: ${l}`);
  }
});
