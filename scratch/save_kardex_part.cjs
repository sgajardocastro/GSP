const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  if (lineNo === 10093) {
    const idx = line.indexOf('kardex-drawer-viewport');
    console.log('idx:', idx);
    const sub = line.slice(idx - 100, idx + 4000);
    fs.writeFileSync('scratch/kardex_template_part.txt', sub, 'utf8');
    console.log('Saved to scratch/kardex_template_part.txt, length:', sub.length);
  }
});
