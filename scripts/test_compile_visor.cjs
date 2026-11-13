const { parse, compileScript, compileTemplate } = require('../ejecucion/frontend/node_modules/@vue/compiler-sfc');
const fs = require('fs');

const path = 'ejecucion/frontend/src/components/Operaciones/ModalVisorReport.vue';
const content = fs.readFileSync(path, 'utf8');

try {
  const { descriptor, errors } = parse(content, { filename: path });
  if (errors.length > 0) {
    console.error('PARSE ERRORS:', errors);
  } else {
    console.log('SFC PARSED OK');
    const script = compileScript(descriptor, { id: 'modal-visor' });
    console.log('SCRIPT COMPILED OK, bindings:', Object.keys(script.bindings || {}));
    const template = compileTemplate({
      id: 'modal-visor',
      filename: path,
      source: descriptor.template.content,
      compilerOptions: { bindingMetadata: script.bindings }
    });
    if (template.errors.length > 0) {
      console.error('TEMPLATE ERRORS:', template.errors);
    } else {
      console.log('TEMPLATE COMPILED OK');
    }
  }
} catch (e) {
  console.error('EXCEPTION:', e);
}
