const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  if ([10204, 10205, 10206, 10207, 10208, 10209, 10236].includes(lineNo)) {
    const obj = JSON.parse(line);
    console.log('=== Line', lineNo, obj.source, obj.type, '===');
    if (obj.tool_calls) {
      console.log('tool calls:', obj.tool_calls.map(tc => tc.name));
      fs.writeFileSync(`scratch/toolcall_${lineNo}.json`, JSON.stringify(obj.tool_calls, null, 2), 'utf8');
    }
    if (obj.content) {
      console.log('content length:', obj.content.length);
      fs.writeFileSync(`scratch/content_${lineNo}.txt`, obj.content, 'utf8');
    }
  }
});
