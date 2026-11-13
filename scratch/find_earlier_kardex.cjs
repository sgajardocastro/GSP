const fs = require('fs');
const readline = require('readline');

async function findEarlierKardex() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (line.includes('fechasDisponiblesKardex') && lineNum < 10092) {
      console.log('Line with fechasDisponiblesKardex before 10092:', lineNum);
    }
    lineNum++;
    if (lineNum >= 10092) break;
  }
}
findEarlierKardex();
