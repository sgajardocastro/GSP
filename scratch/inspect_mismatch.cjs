const fs = require('fs');
const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));
const torre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');

[0, 1, 2].forEach(i => {
  const e = edits[i];
  console.log(`\n=== EDIT ${i} (Step ${e.step}) ===`);
  const lines = e.target.replace(/\r\n/g, '\n').split('\n');
  console.log('Target first line:', lines[0]);
  console.log('Target last line:', lines[lines.length - 1]);
  console.log('Target total lines:', lines.length);

  // Search for the first line in torre
  const firstLineIdx = torre.indexOf(lines[0].trim());
  console.log('Index of trimmed first line in torre:', firstLineIdx);
});
