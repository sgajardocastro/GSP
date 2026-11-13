const fs = require('fs');
const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));

edits.forEach((e, i) => {
  console.log(`\n=================== EDIT ${i} (Step ${e.step}) ===================`);
  console.log('--- TARGET (first 5 lines) ---');
  console.log(e.target.split('\n').slice(0, 5).join('\n'));
  console.log('--- TARGET (last 5 lines) ---');
  console.log(e.target.split('\n').slice(-5).join('\n'));
  console.log('Target line count:', e.target.split('\n').length);

  console.log('--- REPLACEMENT (first 5 lines) ---');
  console.log(e.replacement.split('\n').slice(0, 5).join('\n'));
  console.log('--- REPLACEMENT (last 5 lines) ---');
  console.log(e.replacement.split('\n').slice(-5).join('\n'));
  console.log('Replacement line count:', e.replacement.split('\n').length);
});
