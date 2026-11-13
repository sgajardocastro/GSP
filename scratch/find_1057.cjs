const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  const searchStr = "activeView === 'kardex'";
  if (line.includes(searchStr)) {
    console.log('Found in line', lineNo);
    let pos = 0;
    while (true) {
      const idx = line.indexOf(searchStr, pos);
      if (idx === -1) break;
      console.log('  snippet:', line.slice(Math.max(0, idx - 40), idx + 80).replace(/\n/g, ' '));
      pos = idx + 30;
    }
  }
});
