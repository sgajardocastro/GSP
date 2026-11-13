const fs = require('fs');

let content = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');

const target = `const formatIsoToDdMmYyyy = (iso) => {
  if (!iso || iso.length < 10) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return \`\${d}/\${m}/\${y}\`
}`;

if (content.includes(target)) {
  content = content.replace(target, '// formatIsoToDdMmYyyy already defined above');
  fs.writeFileSync('scratch/Torre_final_assembled.vue', content, 'utf8');
  console.log('Removed duplicate formatIsoToDdMmYyyy');
} else {
  console.log('Target not found, checking with regex');
}
