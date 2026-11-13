const { compileTemplate } = require('./ejecucion/frontend/node_modules/@vue/compiler-sfc');

const template = `
<div>
  <button @click="eliminarItemCosto(tabCostoActiva, idx)">🗑️</button>
  <button @click="eliminarItemCosto('alimentacion', idx)">🗑️</button>
</div>
`;

const res = compileTemplate({
  source: template,
  filename: 'test.vue',
  id: 'test',
  compilerOptions: {
    bindingMetadata: {
      eliminarItemCosto: 'setup-const',
      tabCostoActiva: 'setup-ref',
      idx: 'setup-maybe-ref',
      costos: 'setup-ref'
    }
  }
});

console.log(res.code);
