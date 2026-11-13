const fs = require('fs');
const baseTorre = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8').replace(/\r\n/g, '\n');
const lines = baseTorre.split('\n');
console.log('Lines 4544 to 4611:');
for (let i = 4543; i < lines.length; i++) {
  console.log(lines[i]);
}
