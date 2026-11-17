const fs = require('fs');
const path = require('path');
const pdf = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/pdf-parse'));

const pdfPath = path.resolve(__dirname, 'ot_1842.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
  console.log('=== TOTAL PAGES:', data.numpages);
  console.log('=== PDF TEXT EXTRACTED:');
  console.log(data.text);
}).catch(console.error);
