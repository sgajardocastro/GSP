const fs = require('fs');
const readline = require('readline');

async function inspectReadSteps() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum >= 10085 && lineNum <= 10100) {
      const obj = JSON.parse(line);
      if (obj.content && obj.content.includes('Showing lines')) {
        const match = obj.content.match(/Showing lines (\d+)-(\d+) of (\d+)/);
        if (match) {
          console.log(`Step ${lineNum}: Showing lines ${match[1]}-${match[2]} of ${match[3]}`);
        }
      }
    }
    lineNum++;
    if (lineNum > 10100) break;
  }
}
inspectReadSteps();
