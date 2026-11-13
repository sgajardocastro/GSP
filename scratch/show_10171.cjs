const fs = require('fs');
const readline = require('readline');

async function show10171() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum === 10171 || lineNum === 10172) {
      const obj = JSON.parse(line);
      console.log('=== STEP', lineNum, '===');
      console.log(obj.tool_calls ? JSON.stringify(obj.tool_calls) : obj.content.substring(0, 500));
    }
    lineNum++;
    if (lineNum > 10175) break;
  }
}
show10171();
