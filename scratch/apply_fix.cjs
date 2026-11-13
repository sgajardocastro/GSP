const fs = require('fs');
const path = require('path');

const filePath = path.resolve('ejecucion/frontend/src/views/Torre.vue');
let content = fs.readFileSync(filePath, 'utf8');

const target = `// Resolver columna de Último Mantenimiento para cada equipo
const resolverUltimoMantenimientoEquipo = (eq) => {`;

const replacement = `// Formato DD/MM/YYYY determinista seguro anti-timezone
const formatIsoToDdMmYyyy = (fStr) => {
  if (!fStr) return '—'
  const partes = String(fStr).slice(0, 10).split('-')
  if (partes.length === 3) {
    return \`\${partes[2]}/\${partes[1]}/\${partes[0]}\`
  }
  return String(fStr)
}

// Resolver columna de Último Mantenimiento para cada equipo
const resolverUltimoMantenimientoEquipo = (eq) => {`;

// Normalize for search
const normTarget = target.replace(/\r\n/g, '\n');
const normContent = content.replace(/\r\n/g, '\n');

if (!normContent.includes(normTarget)) {
  throw new Error('Target not found in Torre.vue');
}

const updated = normContent.replace(normTarget, replacement);
fs.writeFileSync(filePath, updated, 'utf8');
console.log('Torre.vue successfully updated with formatIsoToDdMmYyyy.');
