const fs = require('fs');

const content = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

// Check all function calls inside resolverUltimoMantenimientoEquipo and other Gantt functions
const ganttScript = content.slice(content.indexOf('LÓGICA DE LA PERSPECTIVA TEMPORAL DE FLOTA'), content.indexOf('const abrirProyecto'));

console.log('Gantt script length:', ganttScript.length);

// Extract all identifier calls e.g. foo(
const calls = new Set();
const regex = /\b([a-zA-Z0-9_$]+)\s*\(/g;
let m;
while ((m = regex.exec(ganttScript)) !== null) {
  calls.add(m[1]);
}

const jsBuiltins = new Set([
  'ref', 'computed', 'watch', 'onMounted', 'Date', 'String', 'Number', 'Math', 'Array', 'Set', 'Map',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'console', 'Promise', 'Boolean', 'RegExp',
  'if', 'for', 'switch', 'while', 'catch'
]);

const missing = [];
calls.forEach(fn => {
  if (jsBuiltins.has(fn)) return;
  // Check if defined in Torre.vue
  // A definition would be const fn =, function fn(, let fn =
  const defRegex = new RegExp(`\\b(const|let|var|function)\\s+${fn}\\b`);
  if (!defRegex.test(content) && !content.includes(`const { ${fn}`) && !content.includes(`import `)) {
    // Check if imported
    const importRegex = new RegExp(`\\b${fn}\\b.*from`);
    if (!importRegex.test(content)) {
      missing.push(fn);
    }
  }
});

console.log('Potentially undefined functions called in Gantt script:', missing);
