const fs = require('fs');
const content = fs.readFileSync('scratch/kardex_template_part.txt', 'utf8');
console.log(content.slice(0, 3000));
