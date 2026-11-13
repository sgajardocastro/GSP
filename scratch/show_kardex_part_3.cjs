const fs = require('fs');
const content = fs.readFileSync('scratch/kardex_template_part.txt', 'utf8');
const idx = content.indexOf('1315:');
console.log(content.slice(idx));
