const fs = require('fs');

const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));
const allLines = {};

function parseToolOutput(text) {
  const lines = text.split('\n');
  lines.forEach(l => {
    const m = l.match(/^(\d+): (.*)$/);
    if (m) {
      allLines[parseInt(m[1], 10)] = m[2];
    } else {
      const m2 = l.match(/^(\d+):$/);
      if (m2) {
        allLines[parseInt(m2[1], 10)] = '';
      }
    }
  });
}

Object.keys(chunks).forEach(step => {
  parseToolOutput(chunks[step]);
});

const assembled = [];
for (let i = 1; i <= 4611; i++) {
  if (allLines[i] === undefined) {
    throw new Error(`Line ${i} is missing!`);
  }
  assembled.push(allLines[i]);
}

const finalContent = assembled.join('\n');
fs.writeFileSync('scratch/Torre_recovered_base.vue', finalContent, 'utf8');
console.log('Saved 4611 lines to scratch/Torre_recovered_base.vue. Size:', finalContent.length);
