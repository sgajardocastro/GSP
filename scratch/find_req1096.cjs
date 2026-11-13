const fs = require('fs');
const readline = require('readline');

async function findReq1096() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (line.includes('REQ-1096') && line.includes('edit_file')) {
      console.log('Line with REQ-1096 edit_file:', lineNum);
    }
    lineNum++;
    if (lineNum > 10250) break;
  }
}
findReq1096();
