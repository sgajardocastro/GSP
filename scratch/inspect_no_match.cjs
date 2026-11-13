const fs = require('fs');

const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));
const base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');

[2, 3, 4, 5].forEach(i => {
  const e = edits[i];
  const targetFirst = e.target.split('\n')[0].trim();
  console.log(`Edit ${i} target first line: "${targetFirst}"`);
  const pos = base.indexOf(targetFirst);
  console.log(`Position in base: ${pos}`);
});
