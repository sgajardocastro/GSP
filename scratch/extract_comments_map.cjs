const fs = require('fs');
const lines = fs.readFileSync('scratch/matriz_downloaded.csv', 'utf8').split('\n');

const comments = {};
for (let i = 2; i <= 34; i++) {
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
  const id = cols[0];
  const comm = cols[11] || '';
  comments[id] = comm;
  console.log(`CASO ${id}: ${comm}`);
}
fs.writeFileSync('scratch/comments_map.json', JSON.stringify(comments, null, 2));
