const fs = require('fs');

const content = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');
const tplMatch = content.match(/<template>([\s\S]*?)<\/template>/);
const tplCode = tplMatch[1];
const scriptMatch = content.match(/<script setup>([\s\S]*?)<\/script>/);
const scriptCode = scriptMatch[1];

// Find all function calls in template: e.g. fn(...)
const matches = tplCode.matchAll(/\b([a-zA-Z0-9_$]+)\s*\(/g);
const calledInTpl = new Set();
for (const m of matches) {
  calledInTpl.add(m[1]);
}

const builtins = new Set(['Boolean', 'String', 'Number', 'Math', 'Array', 'Date']);

const missing = [];
for (const fn of calledInTpl) {
  if (builtins.has(fn)) continue;
  const inScript = scriptCode.includes(fn);
  if (!inScript) {
    missing.push(fn);
  }
}

console.log('Template calls missing in script:', missing);
