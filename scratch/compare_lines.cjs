const fs = require('fs');
const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));
const torreLines = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').split('\n');

console.log('Torre line 85 to 135:');
console.log(torreLines.slice(84, 135).join('\n'));
