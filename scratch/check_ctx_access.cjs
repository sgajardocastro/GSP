const fs = require('fs');
const path = require('path');
const vuePath = path.resolve('ejecucion/frontend/node_modules/@vue/compiler-sfc');
const { parse, compileScript, compileTemplate } = require(vuePath);

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
const { descriptor } = parse(source);
const script = compileScript(descriptor, { id: 'Torre' });

const templateRes = compileTemplate({
  id: 'Torre',
  source: descriptor.template.content,
  filename: 'Torre.vue',
  compilerOptions: {
    bindingMetadata: script.bindings
  }
});

const code = templateRes.code;
const ctxMatches = code.match(/_ctx\.([a-zA-Z0-9_$]+)/g) || [];
const uniqueCtx = Array.from(new Set(ctxMatches.map(m => m.replace('_ctx.', ''))));

console.log('Variables accessed on _ctx count:', uniqueCtx.length);
console.log('Variables accessed on _ctx:', uniqueCtx);
