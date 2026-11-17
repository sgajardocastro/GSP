const fs = require('fs');
const lines = fs.readFileSync('scratch/matriz_downloaded.csv', 'utf8').split('\n');

for (let i = 10; i <= 25; i++) {
  const row = lines[i];
  if (!row) continue;
  const cols = [];
  let cur = '';
  let inQuotes = false;
  for (let j = 0; j < row.length; j++) {
    const c = row[j];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) { cols.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  cols.push(cur.trim());
  console.log(`=== CASO ${cols[0]} (${cols[2]}) ===`);
  console.log(`Unidad: ${cols[4]} | Cant: ${cols[5]}`);
  console.log(`1. Cotiz: ${cols[6]}`);
  console.log(`2. OT:    ${cols[7]}`);
  console.log(`3. ITS:   ${cols[8]}`);
  console.log(`4. RRHH:  ${cols[9]}`);
  console.log(`5. EDP:   ${cols[10]}`);
  console.log(`-> COMENTARIO (Col L): ${cols[11] || '---'}\n`);
}
