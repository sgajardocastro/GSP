const fs = require('fs');
const readline = require('readline');

async function find4611Chunks() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (line.includes('Showing lines') && line.includes('of 4611')) {
      const match = line.match(/Showing lines (\d+)-(\d+) of 4611/);
      if (match) {
        console.log(`Step ${lineNum}: lines ${match[1]}-${match[2]} of 4611`);
      }
    }
    lineNum++;
    if (lineNum > 10250) break;
  }
}
find4611Chunks();
