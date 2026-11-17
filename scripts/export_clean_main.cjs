const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tempDir = path.resolve('C:/temp/prod_clean_82e0d66');
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

console.log('Exportando commit 82e0d66 (main) a', tempDir);
execSync(`git archive 82e0d66 | tar -x -C "${tempDir}"`, { stdio: 'inherit' });
console.log('Exportación completa.');

const feDir = path.join(tempDir, 'ejecucion/frontend');
console.log('Existe frontend:', fs.existsSync(feDir));
