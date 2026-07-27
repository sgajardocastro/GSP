const fs = require('fs');
const f1 = fs.readFileSync('remote_proyectoModel.js', 'utf8').split('\n');
const f2 = fs.readFileSync('src/models/proyectoModel.js', 'utf8').split('\n');

let diffs = [];
for (let i = 0; i < Math.max(f1.length, f2.length); i++) {
  const line1 = f1[i] ? f1[i].trim() : '(none)';
  const line2 = f2[i] ? f2[i].trim() : '(none)';
  if (line1 !== line2) {
    diffs.push(`Line ${i+1}:\nRemote (PROD): ${line1}\nLocal  (OLD) : ${line2}`);
  }
}
fs.writeFileSync('diff.txt', diffs.join('\n\n'));
