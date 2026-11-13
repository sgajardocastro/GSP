const path = require('path');
const { ref } = require(path.resolve(__dirname, '../ejecucion/frontend/node_modules/vue'));

const tabCostoActiva = ref('peajes');
const costos = ref({
  peajes: [{ id: 1, monto_total: 1000 }]
});

console.log('--- TEST RUNTIME DIRECT ACCESS ---');
console.log('costos.value.peajes:', costos.value.peajes);
console.log('costos[tabCostoActiva]:', costos[tabCostoActiva]);
console.log('costos[tabCostoActiva.value]:', costos[tabCostoActiva.value]);
console.log('costos.value[tabCostoActiva]:', costos.value[tabCostoActiva]);
console.log('costos.value[tabCostoActiva.value]:', costos.value[tabCostoActiva.value]);

const eliminarItemCosto = (cat, idx) => {
  console.log('eliminarItemCosto called with cat:', typeof cat, cat, 'isRef?', cat && cat.__v_isRef);
  if (costos.value[cat]) {
    console.log('Found in costos.value[cat]! Splicing...');
    costos.value[cat].splice(idx, 1);
  } else {
    console.log('NOT FOUND in costos.value[cat]! Because cat is:', cat);
  }
};

console.log('\n--- SIMULATE CLICK WITH tabCostoActiva (as passed by Vue compiled template) ---');
eliminarItemCosto(tabCostoActiva, 0);

console.log('\n--- SIMULATE CLICK WITH unref or cat.value ---');
const catKey = typeof tabCostoActiva === 'object' && tabCostoActiva !== null && 'value' in tabCostoActiva ? tabCostoActiva.value : tabCostoActiva;
eliminarItemCosto(catKey, 0);
console.log('costos.value.peajes after unref:', costos.value.peajes);
