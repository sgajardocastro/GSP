const fs = require('fs');

const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));
const text92 = chunks['10092'];

const lines = text92.split('\n');
lines.forEach(l => {
  if (l.includes('activeView ===') || l.includes('VISTA 1B') || l.includes('VISTA 1C') || l.includes('VISTA 2') || l.includes('Matriz PMO')) {
    console.log(l);
  }
});
