const { execSync } = require('child_process');
const fs = require('fs');

const diff = execSync('git diff ejecucion/frontend/src/views/Torre.vue', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
fs.writeFileSync('scratch/torre_diff_clean.diff', diff, 'utf8');
console.log('Diff lines:', diff.split('\n').length);
console.log('Diff size:', diff.length);
