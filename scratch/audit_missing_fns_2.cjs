const fs = require('fs');

const content = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

const ganttScript = content.slice(content.indexOf('LÓGICA DE LA PERSPECTIVA TEMPORAL DE FLOTA'), content.indexOf('const abrirProyecto'));

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

calls.forEach(fn => {
  if (jsBuiltins.has(fn)) return;
  const def1 = new RegExp(`\\b(const|let|var|function)\\s+${fn}\\b`).test(content);
  const def2 = new RegExp(`import\\s+.*\\b${fn}\\b.*from`).test(content);
  if (!def1 && !def2) {
    console.log(`MISSING DEFINITION: "${fn}"`);
  }
});
