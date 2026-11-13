const fs = require('fs');
const readline = require('readline');

async function findVista1C() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (line.includes('VISTA 1C: CARDEX 3D')) {
      console.log('Line with VISTA 1C: CARDEX 3D:', lineNum);
      const obj = JSON.parse(line);
      console.log('Type:', obj.type);
    }
    lineNum++;
    if (lineNum > 10230) break;
  }
}
findVista1C();
