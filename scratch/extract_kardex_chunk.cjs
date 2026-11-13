const fs = require('fs');
const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));

// In chunk 10092, let's see lines 460 to end
const lines10092 = chunks['10092'].split('\n');
console.log('Chunk 10092 has', lines10092.length, 'lines');
// Find where activeView === 'kardex' starts
let startKardex = -1;
lines10092.forEach((l, idx) => {
  if (l.includes("activeView === 'kardex'")) {
    startKardex = idx;
  }
});
console.log('startKardex in 10092:', startKardex);
if (startKardex !== -1) {
  const slice = lines10092.slice(startKardex, startKardex + 50);
  console.log(slice.join('\n'));
}
