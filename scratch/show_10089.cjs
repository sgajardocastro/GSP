const fs = require('fs');
const readline = require('readline');

async function showAround10089() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum >= 10080 && lineNum <= 10095) {
      const obj = JSON.parse(line);
      console.log(lineNum, obj.type, obj.source, obj.tool_calls ? JSON.stringify(obj.tool_calls.map(t => t.name)) : (obj.content ? obj.content.substring(0, 80) : ''));
    }
    lineNum++;
    if (lineNum > 10095) break;
  }
}
showAround10089();
