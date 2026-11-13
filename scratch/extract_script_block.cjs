const fs = require('fs');

const baseTorre = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = baseTorre.split('\n');

const block = lines.slice(3925, 4532).join('\n');
fs.writeFileSync('scratch/kanban_kardex_script_block.js', block, 'utf8');
console.log('Saved kanban_kardex_script_block.js, length:', block.length, 'lines:', block.split('\n').length);
