const fs = require('fs');

const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));
let base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8').replace(/\r\n/g, '\n');

console.log('Base length:', base.length, 'lines:', base.split('\n').length);

let success = 0;
edits.forEach((e, idx) => {
  const normTarget = e.target.replace(/\r\n/g, '\n');
  const normRep = e.replacement.replace(/\r\n/g, '\n');

  const pos = base.indexOf(normTarget);
  if (pos !== -1) {
    console.log(`Edit ${idx} (step ${e.step}): MATCH FOUND at pos ${pos}`);
    base = base.replace(normTarget, normRep);
    success++;
  } else {
    console.log(`Edit ${idx} (step ${e.step}): NO MATCH! Preview:`, normTarget.substring(0, 80).replace(/\n/g, '\\n'));
  }
});

console.log(`Matched ${success} of ${edits.length} edits.`);

if (success === edits.length) {
  fs.writeFileSync('scratch/Torre_gantt_kanban_applied.vue', base, 'utf8');
  console.log('Saved Gantt + Kanban applied to scratch/Torre_gantt_kanban_applied.vue');
}
