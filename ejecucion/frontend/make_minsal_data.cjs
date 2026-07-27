const xlsx = require('xlsx');
const fs = require('fs');
const wb = xlsx.readFile('d:\\\\SGajardo\\\\Google Drive\\\\Antigravity\\\\Transmac\\\\Antecedentes\\\\DATOS APLICACIÓN\\\\LISTADOS DE VERIFICACIÓN\\\\MINSAL\\\\Herramienta Autoevaluación HSO 2026.xlsx');

const sheetsToParse = [
  { name: 'PAUTA PREXOR', key: 'prexor' },
  { name: 'PAUTA UV', key: 'uv' },
  { name: 'PAUTA TMERT', key: 'tmert' },
  { name: 'PROTOC PSICOSOCIAL', key: 'psicosocial' },
  { name: 'PAUTA SILICE', key: 'silice' },
  { name: 'PAUTA HIPOBARIA', key: 'hipobaria' }
];

let finalJs = '';

for (const s of sheetsToParse) {
  const sheet = wb.Sheets[s.name];
  const rows = xlsx.utils.sheet_to_json(sheet, {header: 1, blankrows: false});
  
  let segments = [];
  let currentSegment = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const col0 = row[0];
    
    // Skip empty or header rows
    if (!col0 || typeof col0 !== 'string') continue;
    
    const isTitleMatch = col0.match(/^(\d+|\w+)\.-/); // "1.- ", "II.-"
    if (isTitleMatch && !row[1]) {
      // It's a title
      currentSegment = {
        title: col0.trim().replace(/'/g, "\\'").replace(/\n/g, " "),
        collapsed: false,
        questions: []
      };
      segments.push(currentSegment);
    } else if (col0.match(/^(\d+|\w+)\.\d+/)) {
       // "1.1", "1.2"
       if (currentSegment) {
          const id = col0.trim();
          const text = (row[1] || '').trim().replace(/'/g, "\\'").replace(/\n/g, " ");
          const ref = (row[2] || '').trim().replace(/'/g, "\\'").replace(/\n/g, " ");
          currentSegment.questions.push(`{ id: '${id}', text: '${text}', ref: '${ref}', val: '0' }`);
       }
    } else {
        // some protocols might not have "1.-" precisely, let's catch if col0 has text but no col1
        if (col0.length > 10 && !row[1] && !col0.includes('LISTADO')) {
            // maybe title
            currentSegment = {
                title: col0.trim().replace(/'/g, "\\'").replace(/\n/g, " "),
                collapsed: false,
                questions: []
            };
            segments.push(currentSegment);
        } else if (currentSegment && col0.length > 0 && row[1]) {
           const id = col0.toString().trim();
           if(id !== 'N°' && id !== 'N° ') {
               const text = (row[1] || '').toString().trim().replace(/'/g, "\\'").replace(/\n/g, " ");
               const ref = (row[2] || '').toString().trim().replace(/'/g, "\\'").replace(/\n/g, " ");
               currentSegment.questions.push(`{ id: '${id}', text: '${text}', ref: '${ref}', val: '0' }`);
           }
        }
    }
  }

  finalJs += `  ${s.key}: [\n`;
  for (const seg of segments) {
      if(seg.questions.length === 0) continue;
      finalJs += `    { \n      title: '${seg.title}', collapsed: false, \n      questions: [\n`;
      for(const q of seg.questions) {
          finalJs += `        ${q},\n`;
      }
      finalJs += `      ]\n    },\n`;
  }
  finalJs += `  ],\n`;
}

fs.writeFileSync('minsal_data.txt', `const checklistData = reactive({\n${finalJs}});\n`);
console.log('Done writing minsal_data.txt');
