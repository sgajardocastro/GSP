const fs = require('fs');

const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));

const text92 = chunks['10092'];
console.log('Length of text92:', text92.length);

const lines = text92.split('\n');
console.log('Line count:', lines.length);
console.log('First 5 lines:');
console.log(lines.slice(0, 5).join('\n'));
console.log('Last 5 lines:');
console.log(lines.slice(-5).join('\n'));
