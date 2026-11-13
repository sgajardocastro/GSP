const fs = require('fs');
const readline = require('readline');

async function show9293() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum === 10092 || lineNum === 10093) {
      const obj = JSON.parse(line);
      console.log(`Step ${lineNum}: type=${obj.type}, content preview=`, obj.content ? obj.content.substring(0, 150) : '');
    }
    lineNum++;
    if (lineNum > 10095) break;
  }
}
show9293();
