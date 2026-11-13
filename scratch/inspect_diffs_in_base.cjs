const fs = require('fs');

const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));
let base = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8');

// Apply Edit 0 and 1 first
base = base.replace(edits[0].target, edits[0].replacement);
base = base.replace(edits[1].target, edits[1].replacement);

console.log('After Edit 0 & 1, let us check Edit 2:');
const e2Target = edits[2].target;
console.log('e2Target found in base?', base.includes(e2Target));
if (!base.includes(e2Target)) {
  // Let's find where it diverges
  const lines = e2Target.split('\n');
  for (let len = lines.length; len > 0; len--) {
    const sub = lines.slice(0, len).join('\n');
    if (base.includes(sub)) {
      console.log(`Edit 2 matches up to line ${len} of ${lines.length}`);
      console.log('Mismatched line in target:', JSON.stringify(lines[len]));
      const idx = base.indexOf(sub);
      const afterInBase = base.slice(idx + sub.length, idx + sub.length + 200);
      console.log('Actual text in base after match:', JSON.stringify(afterInBase.split('\n')[0]));
      break;
    }
  }
}
