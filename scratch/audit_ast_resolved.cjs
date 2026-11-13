const fs = require('fs');
const path = require('path');
const vuePath = path.resolve('ejecucion/frontend/node_modules/@vue/compiler-sfc');
const babelParser = require('ejecucion/frontend/node_modules/@babel/parser');
const traverse = require('ejecucion/frontend/node_modules/@babel/traverse').default;

const { parse, compileScript } = require(vuePath);

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
const { descriptor } = parse(source);
const script = compileScript(descriptor, { id: 'Torre' });

const bindings = new Set(Object.keys(script.bindings || {}));

const globals = new Set([
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  'Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'Math', 'JSON', 'Set', 'Map',
  'console', 'window', 'document', 'event', 'arguments',
  '$event', '$emit', '$route', '$router', '$refs', '$slots', '$attrs'
]);

// Extract expressions from compiled template code
const { compileTemplate } = require(vuePath);
const templateRes = compileTemplate({
  id: 'Torre',
  source: descriptor.template.content,
  filename: 'Torre.vue',
  compilerOptions: {
    bindingMetadata: script.bindings
  }
});

// Parse the compiled render function code with Babel!
const renderAst = babelParser.parse(templateRes.code, { sourceType: 'module' });

const missingBindings = new Set();

traverse(renderAst, {
  Identifier(p) {
    // If it's a binding reference $setup.xyz or _ctx.xyz
    if (p.node.name && !globals.has(p.node.name)) {
      // If it is accessed on _ctx (meaning Vue compiler did not find it in $setup bindings)
      if (
        p.parent.type === 'MemberExpression' &&
        p.parent.object.name === '_ctx' &&
        p.parent.property === p.node
      ) {
        missingBindings.add(p.node.name);
      }
    }
  }
});

console.log('Identifiers accessed on _ctx (unresolved by $setup):', Array.from(missingBindings));
if (missingBindings.size === 0) {
  console.log('PERFECT! 100% of template identifiers resolved to $setup bindings!');
}
