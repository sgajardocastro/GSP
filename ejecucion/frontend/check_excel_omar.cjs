const XLSX = require('./node_modules/xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', '..', 'Carga_Enrolamiento_GSP.xlsx'));
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log(data.filter(r => JSON.stringify(r).toLowerCase().includes('omar')));
