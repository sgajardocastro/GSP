const fs = require('fs');
const pattern = /PJYY|RWJL|JC\.?2796|VCTR|Robert|Mercado|Barrales|Maldonado/i;

function scan(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log('=== SCANNING: ' + filePath + ' ===');
  let count = 0;
  lines.forEach((line, idx) => {
    if (pattern.test(line)) {
      count++;
      console.log(`  L${idx + 1}: ${line.trim()}`);
    }
  });
  console.log('Found ' + count + ' occurrences.\n');
}

scan('ejecucion/backend_remoto/src/controllers/itsController.js');
scan('ejecucion/backend_remoto/src/services/itsPdfService.js');
