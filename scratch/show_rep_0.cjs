const fs = require('fs');
const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));

console.log('REPLACEMENT 0 FULL:');
console.log(edits[0].replacement);
