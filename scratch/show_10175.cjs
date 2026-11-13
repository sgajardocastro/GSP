const fs = require('fs');
const content = fs.readFileSync('scratch/step_10175_content.txt', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);
for (let i = 0; i < 20; i++) console.log(lines[i]);
