const fs = require('fs');
const block = fs.readFileSync('scratch/kanban_kardex_script_block.js', 'utf8');
const lines = block.split('\n');

for (let i = 70; i < 140; i++) {
  console.log(lines[i]);
}
