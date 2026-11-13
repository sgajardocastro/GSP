const fs = require('fs');
const file = 'ejecucion/backend_remoto/src/controllers/controlVivoController.js';
let content = fs.readFileSync(file, 'utf8');

const target = '$10, $11, 1.0, $12';
const replacement = '$10, $11, 0.0, $12';

if (content.includes(target)) {
  content = content.replace(target, () => replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✔ controlVivoController.js line 1973 updated: 1.0 -> 0.0');
} else {
  console.error('Target not found');
}
