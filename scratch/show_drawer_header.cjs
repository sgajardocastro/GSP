const fs = require('fs');
const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));
const lines = chunks['10092'].split('\n');

for (let i = 625; i < 665; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}
