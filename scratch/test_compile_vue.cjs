const fs = require('fs');
const path = require('path');

const vuePath = path.resolve('ejecucion/frontend/node_modules/@vue/compiler-sfc');
const { parse, compileScript, compileTemplate } = require(vuePath);

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');

try {
  const { descriptor, errors } = parse(source);
  if (errors.length > 0) {
    console.error('Parse errors:', errors);
    process.exit(1);
  }
  console.log('Parse OK!');

  // Compile script
  const script = compileScript(descriptor, { id: 'Torre' });
  console.log('Script compile OK! bindings count:', Object.keys(script.bindings || {}).length);

  // Compile template
  const template = compileTemplate({
    id: 'Torre',
    source: descriptor.template.content,
    filename: 'Torre.vue',
    compilerOptions: {
      bindingMetadata: script.bindings
    }
  });

  if (template.errors && template.errors.length > 0) {
    console.error('Template errors:', template.errors);
    process.exit(1);
  }
  console.log('Template compile OK! Zero errors!');

} catch (err) {
  console.error('Compilation failed:', err);
  process.exit(1);
}
