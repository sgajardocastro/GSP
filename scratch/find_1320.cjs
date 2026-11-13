const fs = require('fs');
const readline = require('readline');

const path = 'C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/logs/transcript_full.jsonl';
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });

let lineNo = 0;
rl.on('line', (line) => {
  lineNo++;
  if (line.includes('1320:') || line.includes('1325:')) {
    // Check if it's within a read_file output for Torre.vue
    if (line.includes('Torre.vue') || line.includes('kardex') || line.includes('fecha_reporte') || line.includes('pmoVistaSecundaria')) {
      const idx = line.indexOf('1320:');
      if (idx !== -1) {
        console.log('Line', lineNo, 'around 1320:');
        console.log(line.slice(Math.max(0, idx - 100), idx + 300).replace(/\n/g, ' '));
      }
    }
  }
});
