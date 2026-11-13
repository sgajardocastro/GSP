const fs = require('fs');
const readline = require('readline');

async function showSteps() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum >= 10115 && lineNum <= 10165) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          obj.tool_calls.forEach((tc, i) => {
            if (tc.name === 'edit_file' && tc.args.Path.includes('Torre.vue')) {
              console.log(`Step ${lineNum} Tool ${i}: Target len=${tc.args.Target ? tc.args.Target.length : 0}, Rep len=${tc.args.Replacement ? tc.args.Replacement.length : 0}`);
              console.log('Target start:', tc.args.Target ? tc.args.Target.substring(0, 80).replace(/\n/g, '\\n') : '');
              console.log('Rep start:', tc.args.Replacement ? tc.args.Replacement.substring(0, 80).replace(/\n/g, '\\n') : '');
            }
          });
        }
      } catch (e) {}
    }
    lineNum++;
    if (lineNum > 10165) break;
  }
}
showSteps();
