const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  // Search for strings that would only appear in the body or drawers of kardex:
  // e.g. "kardex-cabinet-column", "kardex-drawer-viewport", "kardex-card-3d", "kardexUnfold", "kardex-tab-header", "kardex-card-body"
  if (line.includes('kardex-card-body') || line.includes('kardex-drawer-viewport')) {
    console.log('Found in step/line', lineNo);
    let pos = 0;
    while (true) {
      const idx = line.indexOf('kardex-drawer-viewport', pos);
      if (idx === -1) break;
      console.log('  snippet at pos', idx, ':', line.slice(Math.max(0, idx - 100), idx + 250).replace(/\n/g, ' '));
      pos = idx + 50;
    }
  }
});
