const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  if (lineNo >= 10165 && lineNo <= 10200) {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      console.log('Step', lineNo, obj.tool_calls.map(tc => `${tc.name} ${tc.args?.Path ? (tc.args.StartLine + '-' + tc.args.EndLine) : ''}`));
    }
  }
});
