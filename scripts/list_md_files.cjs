const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dirs = [
  path.join(rootDir, '.agents', 'specs'),
  path.join(rootDir, 'Gestión'),
  path.join(rootDir, 'Soporte'),
  rootDir
];

const threshold = new Date('2026-10-10T14:00:00-03:00');
const results = [];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    try {
      const st = fs.statSync(full);
      if (st.isFile() && item.endsWith('.md') && st.mtime >= threshold) {
        results.push({
          file: full,
          rel: path.relative(rootDir, full),
          mtime: st.mtime,
          size: st.size
        });
      }
    } catch(e) {}
  }
}

results.sort((a, b) => b.mtime - a.mtime);

console.log('=== ARCHIVOS .md GENERADOS / MODIFICADOS EN ESTA CONVERSACIÓN (DESDE 10-OCT-2026 14:00) ===\n');
for (const r of results) {
  const d = r.mtime.toISOString().replace('T', ' ').substring(0, 19);
  console.log(`${d} | ${(r.size / 1024).toFixed(1).padStart(6, ' ')} KB | ${r.rel}`);
}
