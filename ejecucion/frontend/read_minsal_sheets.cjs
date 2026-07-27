const xlsx = require('xlsx');
const wb = xlsx.readFile('d:\\\\SGajardo\\\\Google Drive\\\\Antigravity\\\\Transmac\\\\Antecedentes\\\\DATOS APLICACIÓN\\\\LISTADOS DE VERIFICACIÓN\\\\MINSAL\\\\Herramienta Autoevaluación HSO 2026.xlsx');
console.log(wb.SheetNames);
