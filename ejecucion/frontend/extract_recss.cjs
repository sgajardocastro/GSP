const xlsx = require('xlsx');
const fs = require('fs');
const wb = xlsx.readFile('d:\\SGajardo\\Google Drive\\Antigravity\\Transmac\\Antecedentes\\DATOS APLICACIÓN\\LISTADOS DE VERIFICACIÓN\\RECSS\\03. Verificación Fase 2 Terreno y Documental _2025.xlsx');

const result = {};
for (const sheetName of ['TERRENO', 'DOCUMENTAL', 'ACCIDENTABILIDAD']) {
    const sheet = wb.Sheets[sheetName];
    if (sheet) {
        result[sheetName] = xlsx.utils.sheet_to_json(sheet, {header: 1, blankrows: false}).slice(0, 50);
    }
}
fs.writeFileSync('recss_sample.json', JSON.stringify(result, null, 2));
console.log('Sample written to recss_sample.json');
