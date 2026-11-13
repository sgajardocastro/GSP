const fs = require('fs');
const readline = require('readline');

async function findComparativas() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (line.includes('Incluye 3 Vistas Comparativas Kanban')) {
      console.log('Line number with Comparativas:', lineNum);
      const obj = JSON.parse(line);
      console.log('Type:', obj.type);
    }
    lineNum++;
    if (lineNum > 10220) break;
  }
}
findComparativas();
