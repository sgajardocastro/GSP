const fs = require('fs');
const readline = require('readline');

async function findAllEdits() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (line.includes('edit_file') && line.includes('Torre.vue')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.name === 'edit_file' && tc.args.Path && tc.args.Path.includes('Torre.vue')) {
              console.log(lineNum, tc.args.Target ? tc.args.Target.substring(0, 50).replace(/\n/g, '\\n') : 'NO TARGET');
            }
          });
        }
      } catch (e) {}
    }
    lineNum++;
  }
}
findAllEdits();
