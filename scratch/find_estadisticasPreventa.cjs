const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  if (line.includes('estadisticasPreventa')) {
    console.log('Step', lineNo);
    const idx = line.indexOf('estadisticasPreventa');
    console.log(line.slice(Math.max(0, idx - 50), idx + 200).replace(/\n/g, ' '));
  }
});
