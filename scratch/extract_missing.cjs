const fs = require('fs');
const readline = require('readline');

async function extractMissing() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const neededSteps = new Set([10288, 10289]);
  const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));

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
    if (lineNum > 10295) break;
  }

  fs.writeFileSync('scratch/transcript_chunks.json', JSON.stringify(chunks), 'utf8');
  console.log('Updated chunks in scratch/transcript_chunks.json');
}

extractMissing();
