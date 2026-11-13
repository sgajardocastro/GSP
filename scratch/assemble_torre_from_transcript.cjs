const fs = require('fs');
const readline = require('readline');

async function extractChunks() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const neededSteps = new Set([10089, 10092, 10093, 10095, 10096, 10098, 10182, 10200]);
  const chunks = {};

  let lineNum = 0;
  for await (const line of rl) {
    if (neededSteps.has(lineNum)) {
      try {
        const obj = JSON.parse(line);
        chunks[lineNum] = obj.content;
        console.log(`Extracted step ${lineNum}, content length: ${obj.content ? obj.content.length : 0}`);
      } catch (e) {
        console.error('Error parsing step', lineNum, e.message);
      }
    }
    lineNum++;
    if (lineNum > 10205) break;
  }

  fs.writeFileSync('scratch/transcript_chunks.json', JSON.stringify(chunks), 'utf8');
  console.log('Saved chunks to scratch/transcript_chunks.json');
}

extractChunks();
