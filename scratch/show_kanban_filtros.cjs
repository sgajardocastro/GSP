const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');
const lines = base.split('\n');

console.log('Lines 720 to 760:');
console.log(lines.slice(719, 760).join('\n'));
