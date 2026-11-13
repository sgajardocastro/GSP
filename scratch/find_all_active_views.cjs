const fs = require('fs');
const lines = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').split('\n');

console.log('Torre.vue lines 125-135:');
console.log(lines.slice(124, 135).join('\n'));

// Find next activeView
for (let i = 126; i < lines.length; i++) {
  if (lines[i].includes('activeView ===')) {
    console.log(`Found activeView at line ${i + 1}:`, lines[i]);
  }
}
