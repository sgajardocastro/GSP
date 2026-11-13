const fs = require('fs');

for (const line of [10206, 10208]) {
  const f = `scratch/toolcall_${line}.json`;
  if (fs.existsSync(f)) {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    console.log('=== Line', line, '===');
    console.log(JSON.stringify(d, null, 2));
  }
}
