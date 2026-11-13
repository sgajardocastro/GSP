const fs = require('fs');
const block = fs.readFileSync('scratch/kanban_kardex_script_block.js', 'utf8');
const lines = block.split('\n');

for (let i = 0; i < 70; i++) {
  console.log(lines[i]);
}
