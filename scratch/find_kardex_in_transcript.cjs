const fs = require('fs');
const readline = require('readline');

async function findKardex() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (line.includes('fechasDisponiblesKardex')) {
      console.log('Line with fechasDisponiblesKardex:', lineNum);
      const obj = JSON.parse(line);
      console.log('Type:', obj.type, 'Source:', obj.source);
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => console.log('  tc:', tc.name, tc.args.Path || tc.args.CommandLine || ''));
      }
    }
    lineNum++;
    if (lineNum > 10250) break;
  }
}
findKardex();
