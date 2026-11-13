const fs = require('fs');

const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');
const lines = base.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('activeView === \'kardex\'')) {
    console.log('Found activeView === kardex at line', i + 1);
    console.log(lines.slice(i, i + 50).join('\n'));
    break;
  }
}
