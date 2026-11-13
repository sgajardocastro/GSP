const fs = require('fs');
const path = require('path');
const vuePath = path.resolve('ejecucion/frontend/node_modules/@vue/compiler-sfc');
const { parse, compileScript, compileTemplate } = require(vuePath);

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
const { descriptor } = parse(source);
const script = compileScript(descriptor, { id: 'Torre' });

const bindings = new Set(Object.keys(script.bindings || {}));

// Standard globals and Vue built-ins
const globals = new Set([
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  'Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'Math', 'JSON', 'Set', 'Map',
  'console', 'window', 'document', 'event', 'arguments',
  '$event', '$emit', '$route', '$router', '$refs', '$slots', '$attrs',
  '_ctx', '_cache', '_openBlock', '_createElementBlock', '_createVNode',
  '_Fragment', '_renderList', '_toDisplayString', '_normalizeClass',
  '_normalizeStyle', '_withModifiers', '_withDirectives', '_vModelText',
  '_vModelSelect', '_vModelCheckbox', '_vModelRadio', '_createCommentVNode',
  '_createElementVNode', '_createTextVNode', '_resolveComponent'
]);

// Extract all expressions from template
const templateCode = descriptor.template.content;

// Match all {{ expression }}
const exprs = [];
const mustacheRe = /\{\{([^}]+)\}\}/g;
let m;
while ((m = mustacheRe.exec(templateCode)) !== null) {
  exprs.push(m[1]);
}

// Match all :attr="expression" and @event="expression" and v-if="expression"
const directiveRe = /(?:v-[a-z-]+|:[a-z-]+|@[a-z.-]+)="([^"]+)"/g;
while ((m = directiveRe.exec(templateCode)) !== null) {
  exprs.push(m[1]);
}

console.log('Total expressions found in template:', exprs.length);

// Extract words / identifiers
const usedIdentifiers = new Set();
const idRe = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;

// Local template variables from v-for
const templateLocals = new Set([
  'p', 'col', 'idx', 'r', 'o', 'eq', 'dia', 'grupo', 'itemFecha', 'preset',
  'item', 'opt', 'sub', 'k', 'val', 'v', 'l', 'c', 't', 'd', 's', 'cat',
  'dias', 'op', 'rig', 'cli', 'vend', 'f', 'fecha'
]);

exprs.forEach(expr => {
  let idM;
  while ((idM = idRe.exec(expr)) !== null) {
    const id = idM[1];
    if (!globals.has(id) && !templateLocals.has(id)) {
      usedIdentifiers.add(id);
    }
  }
});

console.log('Unique custom identifiers in template expressions:', usedIdentifiers.size);

const missing = [];
usedIdentifiers.forEach(id => {
  if (!bindings.has(id)) {
    missing.push(id);
  }
});

console.log('Missing bindings:', missing);
if (missing.length === 0) {
  console.log('PERFECT! ZERO missing bindings across entire template!');
} else {
  console.log(`Found ${missing.length} missing bindings.`);
}
