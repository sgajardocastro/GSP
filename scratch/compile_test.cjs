const path = require('path');
const sfc = require(path.resolve(__dirname, '../ejecucion/frontend/node_modules/@vue/compiler-sfc'));

const res = sfc.compileTemplate({
  source: `
  <div>
    <span>{{ (costos[tab.key] || []).length }}</span>
    <div v-if="(costos[tabCostoActiva] || []).length === 0">empty</div>
    <tr v-for="(it, idx) in (costos[tabCostoActiva] || [])">
      <td><button @click="eliminarItemCosto(tabCostoActiva, idx)">🗑️</button></td>
    </tr>
  </div>
  `,
  filename: 'a.vue',
  id: 'a',
  compilerOptions: {
    bindingMetadata: {
      eliminarItemCosto: 'setup-const',
      tabCostoActiva: 'setup-ref',
      costos: 'setup-ref'
    }
  }
});

console.log(res.code);
