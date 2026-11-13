const fs = require('fs');
const content = fs.readFileSync('scratch/content_10205.txt', 'utf8');
const lines = content.split('\n');
console.log('Lines 280 to end of content_10205:');
for (let i = 270; i < lines.length; i++) {
  console.log(lines[i]);
}
