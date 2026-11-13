const fs = require('fs');
const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));

console.log('=== TARGET 0 (first 10 lines) ===');
console.log(edits[0].target.split('\n').slice(0, 10).join('\n'));
console.log('=== TARGET 0 (last 10 lines) ===');
console.log(edits[0].target.split('\n').slice(-10).join('\n'));
console.log('=== REPLACEMENT 0 (first 25 lines) ===');
console.log(edits[0].replacement.split('\n').slice(0, 25).join('\n'));
