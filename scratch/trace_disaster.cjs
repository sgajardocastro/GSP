const fs = require('fs');
const readline = require('readline');

async function traceDisaster() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    if (lineNum >= 10340 && lineNum <= 10390) {
      const obj = JSON.parse(line);
      console.log(lineNum, obj.type, obj.source, obj.tool_calls ? JSON.stringify(obj.tool_calls.map(t => ({ name: t.name, cmd: t.args.CommandLine || t.args.Path }))) : (obj.content ? obj.content.substring(0, 100) : ''));
    }
    lineNum++;
    if (lineNum > 10390) break;
  }
}
traceDisaster();
