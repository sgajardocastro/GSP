const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');

const lines = base.split('\n');
console.log(lines.slice(1592, 1660).join('\n'));
