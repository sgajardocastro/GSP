const data = require('./recss_sample.json');
const fs = require('fs');

let terrenoStr = '';
for (let row of data.TERRENO) {
    if (!row[2] || !row[2].startsWith('P')) continue;
    let pct = row[1] ? (row[1]*100) + '%' : '';
    let text = row[2].replace(/'/g, "\\'").replace(/\n/g, " ");
    let verif = (row[3] || '').replace(/'/g, "\\'").replace(/\n/g, " ");
    let id = text.split(' ')[0];
    text = text.substring(id.length).trim();
    terrenoStr += `    { id: '${id}', pct: '${pct}', text: '${text}', verif: '${verif}', val: '-' },\n`;
}

let docStr = '';
for (let row of data.DOCUMENTAL) {
    if (!row[2] || !row[2].startsWith('P')) continue;
    let pct = row[1] ? (row[1]*100) + '%' : '';
    let text = row[2].replace(/'/g, "\\'").replace(/\n/g, " ");
    let verif = (row[3] || '').replace(/'/g, "\\'").replace(/\n/g, " ");
    let id = text.split(' ')[0];
    text = text.substring(id.length).trim();
    docStr += `    { id: '${id}', pct: '${pct}', text: '${text}', verif: '${verif}', val: '-' },\n`;
}

let accStr = '';
for (let row of data.ACCIDENTABILIDAD) {
    if (!row[0] || !row[0].startsWith('¿La empresa tuvo')) continue;
    let text = row[0].replace(/'/g, "\\'").replace(/\n/g, " ");
    let opc = row[4];
    let mult = row[5];
    accStr += `    { id: '', text: '${text}', opc: '${opc}', mult: ${mult}, val: 0 },\n`;
}

const finalCode = `
const activeTab = ref('terreno')

const checklistData = reactive({
  terreno: [\n${terrenoStr}  ],
  documental: [\n${docStr}  ],
  accidentabilidad: [\n${accStr}  ]
})
`;
fs.writeFileSync('data.txt', finalCode);
console.log('done');
