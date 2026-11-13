const fs = require('fs');
const readline = require('readline');

async function findReadsBefore10331() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum >= 10280 && lineNum < 10331) {
      if (line.includes('read_file') && line.includes('Torre.vue')) {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.name === 'read_file' && tc.args.Path && tc.args.Path.includes('Torre.vue')) {
              console.log(lineNum, 'Start:', tc.args.StartLine, 'End:', tc.args.EndLine);
            }
          });
        }
      }
    }
    lineNum++;
    if (lineNum >= 10331) break;
  }
}
findReadsBefore10331();
