const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  if ([10210, 10211, 10212, 10213, 10214, 10215].includes(lineNo)) {
    const obj = JSON.parse(line);
    console.log('=== Line', lineNo, obj.source, obj.type, '===');
    if (obj.tool_calls) {
      console.log('tool calls:', JSON.stringify(obj.tool_calls));
    }
    if (obj.content) {
      console.log('content len:', obj.content.length);
      fs.writeFileSync(`scratch/step_${lineNo}_content.txt`, obj.content, 'utf8');
    }
  }
});
