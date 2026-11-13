const fs = require('fs');

const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));
let torre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

// Normalize to LF for matching
const normalize = str => str.replace(/\r\n/g, '\n');

let normalizedTorre = normalize(torre);

console.log('Original normalized length:', normalizedTorre.length);

let successCount = 0;
edits.forEach((e, idx) => {
  const normTarget = normalize(e.target);
  const normRep = normalize(e.replacement);

  const pos = normalizedTorre.indexOf(normTarget);
  if (pos !== -1) {
    console.log(`Edit ${idx} (step ${e.step}): MATCH FOUND at pos ${pos}`);
    normalizedTorre = normalizedTorre.replace(normTarget, normRep);
    successCount++;
  } else {
    console.log(`Edit ${idx} (step ${e.step}): NO MATCH! Target preview:`, normTarget.substring(0, 100).replace(/\n/g, '\\n'));
  }
});

console.log(`Successfully matched ${successCount} of ${edits.length} edits.`);

// Also verify that Reports por OT is still present
const hasReportsOT = normalizedTorre.includes('gruposReportsPorOT');
console.log('Does resulting file retain gruposReportsPorOT?', hasReportsOT);
