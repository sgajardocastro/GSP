const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

const { ref, computed, watch, onMounted } = require(path.resolve('ejecucion/frontend/node_modules/vue'));

console.log('Vue loaded successfully!');
console.log('Does script define formatIsoToDdMmYyyy?', content.includes('function formatIsoToDdMmYyyy') || content.includes('const formatIsoToDdMmYyyy'));

// Let's test resolverUltimoMantenimientoEquipo with formatIsoToDdMmYyyy missing
try {
  const eq = { id_equipo: 1, patente: 'TEST-01', mnt_info: { fecha_ultima_mantencion: '2026-11-01' } };
  // Check what happens
  const fechaRaw = eq.mnt_info.fecha_ultima_mantencion;
  // This is what line 3248 does:
  eval('formatIsoToDdMmYyyy(String(fechaRaw).slice(0, 10))');
} catch (e) {
  console.log('EXPECTED ERROR DEMONSTRATED:', e.name, e.message);
}
