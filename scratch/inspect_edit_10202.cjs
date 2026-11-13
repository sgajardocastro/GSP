const fs = require('fs');
const edit = JSON.parse(fs.readFileSync('scratch/edit_10202.json', 'utf8'));

console.log('Path:', edit.Path);
console.log('Target length:', edit.Target.length);
console.log('Replacement length:', edit.Replacement.length);

const targetLines = edit.Target.split('\n');
console.log('Target line count:', targetLines.length);
console.log('Target first 10 lines:');
for (let i = 0; i < 10; i++) console.log((i+1) + ': ' + targetLines[i]);
console.log('Target last 10 lines:');
for (let i = targetLines.length - 10; i < targetLines.length; i++) console.log((i+1) + ': ' + targetLines[i]);

const repLines = edit.Replacement.split('\n');
console.log('Replacement line count:', repLines.length);
console.log('Replacement first 10 lines:');
for (let i = 0; i < 10; i++) console.log((i+1) + ': ' + repLines[i]);
console.log('Replacement last 10 lines:');
for (let i = repLines.length - 10; i < repLines.length; i++) console.log((i+1) + ': ' + repLines[i]);
