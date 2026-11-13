const fs = require('fs');
const readline = require('readline');

async function show10086() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum === 10086) {
      const obj = JSON.parse(line);
      console.log(JSON.stringify(obj.tool_calls, null, 2));
      break;
    }
    lineNum++;
  }
}
show10086();
