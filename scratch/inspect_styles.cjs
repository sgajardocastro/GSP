const fs = require('fs');
const path = require('path');

const stylesXml = fs.readFileSync(path.join(__dirname, 'xlsx_unzipped/xl/styles.xml'), 'utf8');
console.log('=== FILLS IN STYLES.XML ===');
const fills = stylesXml.match(/<fills[\s\S]*?<\/fills>/);
console.log(fills ? fills[0] : 'NO FILLS');

console.log('=== CELLXFS IN STYLES.XML (first 10) ===');
const xfs = stylesXml.match(/<cellXfs[\s\S]*?<\/cellXfs>/);
console.log(xfs ? xfs[0].slice(0, 800) : 'NO XFS');
