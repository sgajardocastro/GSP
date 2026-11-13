const fs = require('fs');

const content = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

// Check formatIsoToDdMmYyyy
console.log('Currently in Torre.vue:');
console.log('Occurrences of formatIsoToDdMmYyyy:', (content.match(/formatIsoToDdMmYyyy/g) || []).length);

// If we inject formatIsoToDdMmYyyy right before resolverUltimoMantenimientoEquipo:
const patchedContent = content.replace(
  '// Resolver columna de Último Mantenimiento para cada equipo\nconst resolverUltimoMantenimientoEquipo = (eq) => {',
  `// Formato DD/MM/YYYY determinista seguro
const formatIsoToDdMmYyyy = (fStr) => {
  if (!fStr) return '—'
  const partes = String(fStr).slice(0, 10).split('-')
  if (partes.length === 3) {
    return \`\${partes[2]}/\${partes[1]}/\${partes[0]}\`
  }
  return String(fStr)
}

// Resolver columna de Último Mantenimiento para cada equipo
const resolverUltimoMantenimientoEquipo = (eq) => {`
);

console.log('Patched occurrences of formatIsoToDdMmYyyy:', (patchedContent.match(/formatIsoToDdMmYyyy/g) || []).length);
console.log('Did patch succeed?', patchedContent.includes('const formatIsoToDdMmYyyy = (fStr) => {'));
