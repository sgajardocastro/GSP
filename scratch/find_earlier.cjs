const fs = require('fs');
const readline = require('readline');

async function findEarlier() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum >= 10100 && lineNum < 10201) {
      if (line.includes('edit_file') && line.includes('Torre.vue')) {
        console.log('Edit to Torre.vue at line:', lineNum);
      }
    }
    lineNum++;
    if (lineNum >= 10201) break;
  }
}
findEarlier();
