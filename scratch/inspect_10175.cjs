const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  if (lineNo === 10175) {
    const obj = JSON.parse(line);
    console.log('Step 10175 content length:', obj.content?.length);
    fs.writeFileSync('scratch/step_10175_content.txt', obj.content || '', 'utf8');
  }
});
