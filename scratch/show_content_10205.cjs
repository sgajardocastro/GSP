const fs = require('fs');
const content = fs.readFileSync('scratch/content_10205.txt', 'utf8');
const lines = content.split('\n');
console.log('Total lines in content_10205:', lines.length);
for (let i = 0; i < Math.min(50, lines.length); i++) {
  console.log(lines[i]);
}
