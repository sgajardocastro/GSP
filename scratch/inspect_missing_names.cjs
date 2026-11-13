const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const baseTorre = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8').replace(/\r\n/g, '\n');

const names = [
  'estadisticasPreventa', 'abrirModalOperativo', 'getPorcentajeAcreditacion',
  'getAcreditacionColorClass', 'colapsarTodas', 'expandirTodas', 'isCategoria',
  'categoriaExpandida', 'calcularDevengado'
];

console.log('--- In currentTorre ---');
names.forEach(n => {
  const matches = currentTorre.match(new RegExp(`[a-zA-Z0-9_$]*${n}[a-zA-Z0-9_$]*`, 'gi')) || [];
  console.log(n, '->', Array.from(new Set(matches)));
});

console.log('--- In baseTorre ---');
names.forEach(n => {
  const matches = baseTorre.match(new RegExp(`[a-zA-Z0-9_$]*${n}[a-zA-Z0-9_$]*`, 'gi')) || [];
  console.log(n, '->', Array.from(new Set(matches)));
});
