const fs = require('fs');

const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));

const allLines = {};

function parseToolOutput(text) {
  const lines = text.split('\n');
  lines.forEach(l => {
    // Format is "123:   code..."
    const m = l.match(/^(\d+): (.*)$/);
    if (m) {
      const lineNo = parseInt(m[1], 10);
      allLines[lineNo] = m[2];
    } else {
      const m2 = l.match(/^(\d+):$/);
      if (m2) {
        const lineNo = parseInt(m2[1], 10);
        allLines[lineNo] = '';
      }
    }
  });
}

Object.keys(chunks).forEach(step => {
  parseToolOutput(chunks[step]);
});

const lineNumbers = Object.keys(allLines).map(n => parseInt(n, 10)).sort((a, b) => a - b);
console.log(`Total unique lines parsed: ${lineNumbers.length}`);
console.log(`Min line: ${lineNumbers[0]}, Max line: ${lineNumbers[lineNumbers.length - 1]}`);

// Check for missing lines between 1 and 4611
const missing = [];
for (let i = 1; i <= 4611; i++) {
  if (allLines[i] === undefined) {
    missing.push(i);
  }
}
console.log(`Missing line count: ${missing.length}`);
if (missing.length > 0) {
  console.log('Missing ranges:', missing.slice(0, 20), '... total missing:', missing.length);
}
