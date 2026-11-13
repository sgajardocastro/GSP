const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const block = fs.readFileSync('scratch/kanban_kardex_script_block.js', 'utf8');

// Find all const/let/var/function declarations in block
const blockDecls = [];
const regex = /(?:const|let|var|function)\s+([a-zA-Z0-9_$]+)/g;
let m;
while ((m = regex.exec(block)) !== null) {
  blockDecls.push(m[1]);
}
console.log('Declarations in block:', blockDecls.length);

const duplicates = [];
blockDecls.forEach(d => {
  const re = new RegExp(`(?:const|let|var|function)\\s+${d}\\b`);
  if (re.test(currentTorre)) {
    duplicates.push(d);
  }
});

console.log('Duplicates already declared in currentTorre:', duplicates);
