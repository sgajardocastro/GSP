const fs = require('fs');
const readline = require('readline');

async function extract() {
  const fileStream = fs.createReadStream('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const targetSteps = new Set([10201, 10205, 10207, 10211, 10217, 10221, 10227, 10229]);
  const collected = [];

  let lineNum = 0;
  for await (const line of rl) {
    if (targetSteps.has(lineNum)) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.name === 'edit_file' && tc.args.Path.includes('Torre.vue')) {
              collected.push({
                step: lineNum,
                target: tc.args.Target,
                replacement: tc.args.Replacement
              });
            }
          });
        }
      } catch (err) {
        console.error('Parse err at line', lineNum, err.message);
      }
    }
    lineNum++;
    if (lineNum > 10250) break;
  }

  fileStream.destroy();
  fs.writeFileSync('scratch/collected_gantt_edits.json', JSON.stringify(collected, null, 2), 'utf8');
  console.log('Successfully saved', collected.length, 'edits to scratch/collected_gantt_edits.json');
}

extract();
