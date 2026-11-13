const fs = require('fs');

const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));
const text88 = chunks['10288'];

if (text88) {
  const lines = text88.split('\n');
  lines.forEach(l => {
    const m = l.match(/^(\d+):/);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num >= 1315 && num <= 1405) {
        console.log(l);
      }
    }
  });
} else {
  console.log('No text88');
}
