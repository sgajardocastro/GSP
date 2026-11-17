const fs = require('fs');
const path = require('path');

const basePath = path.resolve(__dirname, 'xlsx_unzipped/xl');
const stylesXml = fs.readFileSync(path.join(basePath, 'styles.xml'), 'utf8');
const stringsXml = fs.readFileSync(path.join(basePath, 'sharedStrings.xml'), 'utf8');
const sheet1Xml = fs.readFileSync(path.join(basePath, 'worksheets/sheet1.xml'), 'utf8');

// 1. Parse sharedStrings
const strings = [];
const siRegex = /<si>([\s\S]*?)<\/si>/g;
let siMatch;
while ((siMatch = siRegex.exec(stringsXml)) !== null) {
  const tMatches = siMatch[1].match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
  const text = tMatches.map(t => t.replace(/<\/?t[^>]*>/g, '')).join('');
  strings.push(text);
}

// 2. Parse fills in stylesXml
const fills = [];
const fillsBlockMatch = stylesXml.match(/<fills[^>]*>([\s\S]*?)<\/fills>/);
if (fillsBlockMatch) {
  const fillRegex = /<fill>([\s\S]*?)<\/fill>/g;
  let fMatch;
  while ((fMatch = fillRegex.exec(fillsBlockMatch[1])) !== null) {
    const fContent = fMatch[1];
    const fgMatch = fContent.match(/<fgColor\s+rgb="([^"]+)"/);
    if (fgMatch) {
      fills.push({ rgb: fgMatch[1] });
    } else {
      fills.push({ rgb: 'NONE' });
    }
  }
}

// 3. Parse cellXfs (style index -> fillId)
const cellXfs = [];
const xfsBlockMatch = stylesXml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/);
if (xfsBlockMatch) {
  const xfRegex = /<xf\s+([^>]*)\/?>/g;
  let xMatch;
  while ((xMatch = xfRegex.exec(xfsBlockMatch[1])) !== null) {
    const fillIdMatch = xMatch[1].match(/fillId="(\d+)"/);
    cellXfs.push({ fillId: fillIdMatch ? parseInt(fillIdMatch[1]) : 0 });
  }
}

// 4. Parse rows in sheet1.xml
const rows = [];
const rowRegex = /<row\s+r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
let rMatch;
while ((rMatch = rowRegex.exec(sheet1Xml)) !== null) {
  const rowNum = parseInt(rMatch[1]);
  const rowContent = rMatch[2];

  const cells = {};
  const cRegex = /<c\s+r="([A-Z]+)\d+"(?:\s+s="(\d+)")?(?:\s+t="([a-z]+)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?<\/c>/g;
  let cMatch;
  while ((cMatch = cRegex.exec(rowContent)) !== null) {
    const col = cMatch[1];
    const styleIdx = cMatch[2] ? parseInt(cMatch[2]) : null;
    const type = cMatch[3] || 'n';
    let val = cMatch[4] || '';
    if (type === 's' && val !== '') {
      val = strings[parseInt(val)] || '';
    }

    let fillColor = { rgb: 'NONE' };
    if (styleIdx !== null && cellXfs[styleIdx]) {
      const fId = cellXfs[styleIdx].fillId;
      fillColor = fills[fId] || { rgb: 'NONE' };
    }

    cells[col] = { val, styleIdx, fillColor };
  }
  rows.push({ rowNum, cells });
}

console.log('=== CLASIFICACION EXACTA DE LA MATRIZ (REVISION JORGE Y ALFONSO) ===\n');

const correctos = [];
const noAplican = [];
const paraAjustar = [];
const transversales = [];

rows.forEach(r => {
  if (r.rowNum <= 3) return; // Skip headers
  const colA = r.cells['A'] ? r.cells['A'].val : '';
  const colB = r.cells['B'] ? r.cells['B'].val : '';
  const colC = r.cells['C'] ? r.cells['C'].val : '';
  const colD = r.cells['D'] ? r.cells['D'].val : '';
  const colE = r.cells['E'] ? r.cells['E'].val : '';
  const colL = r.cells['L'] ? r.cells['L'] : null;

  const comentario = colL ? colL.val : '';
  const rgb = colL ? colL.fillColor.rgb : 'NONE';

  const item = {
    fila: r.rowNum,
    id: colA,
    linea: colB,
    nodo: colC,
    rol: colD,
    modalidad: colE,
    comentario,
    rgb
  };

  if (!colA && comentario && r.rowNum >= 36) {
    transversales.push(item);
  } else if (colA === 'transversales') {
    transversales.push(item);
  } else if (rgb === 'FFE06666') {
    paraAjustar.push(item);
  } else if (rgb === 'FF00FFFF') {
    noAplican.push(item);
  } else {
    // NONE or FFFFFFFF
    correctos.push(item);
  }
});

console.log(`--- 1. EN ROJO (DEBEN SER AJUSTADOS) [Total: ${paraAjustar.length}] ---`);
paraAjustar.forEach(x => {
  console.log(`[${x.id}] ${x.linea} | ${x.nodo} | ${x.modalidad}`);
  console.log(`   -> Comentario: "${x.comentario}"\n`);
});

console.log(`\n--- 2. EN CELESTE (NO APLICAN / DESCARTADOS) [Total: ${noAplican.length}] ---`);
noAplican.forEach(x => {
  console.log(`[${x.id}] ${x.linea} | ${x.nodo} | ${x.modalidad}`);
  console.log(`   -> Comentario: "${x.comentario}"\n`);
});

console.log(`\n--- 3. EN BLANCO (CORRECTOS) [Total: ${correctos.length}] ---`);
correctos.forEach(x => {
  console.log(`[${x.id}] ${x.linea} | ${x.nodo} | ${x.modalidad}`);
  if (x.comentario) console.log(`   -> Comentario: "${x.comentario}"`);
});

console.log(`\n--- 4. NOTAS TRANSVERSALES (Filas 36-44) [Total: ${transversales.length}] ---`);
transversales.forEach((x, idx) => {
  console.log(`T.${idx + 1} (Fila ${x.fila}): "${x.comentario}"`);
});
