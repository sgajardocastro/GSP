const fs = require('fs');

const edits = JSON.parse(fs.readFileSync('scratch/collected_gantt_edits.json', 'utf8'));
let torre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

// Normalize CRLF to LF
torre = torre.replace(/\r\n/g, '\n');

// Apply Gantt edits (3, 4, 5, 6, 7)
[3, 4, 5, 6, 7].forEach(i => {
  const e = edits[i];
  const target = e.target.replace(/\r\n/g, '\n');
  const rep = e.replacement.replace(/\r\n/g, '\n');
  if (!torre.includes(target)) {
    throw new Error(`Target ${i} not found!`);
  }
  torre = torre.replace(target, rep);
  console.log(`Applied edit ${i}`);
});

fs.writeFileSync('ejecucion/frontend/src/views/Torre.vue', torre, 'utf8');
console.log('Torre.vue updated with Gantt improvements! Verifying reports OT...');
console.log('Has gruposReportsPorOT:', torre.includes('gruposReportsPorOT'));
console.log('Has kpisGantt:', torre.includes('kpisGantt'));
console.log('Has gruposCategoriaGantt:', torre.includes('gruposCategoriaGantt'));
console.log('Has calcularDevengadoReportsEquipo:', torre.includes('calcularDevengadoReportsEquipo'));
console.log('Has resolverUltimoMantenimientoEquipo:', torre.includes('resolverUltimoMantenimientoEquipo'));
