const fs = require('fs');

const torre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');

// Check what variables and components exist for Kanban and Cardex
const terms = [
  'kanban_filtros',
  'kardex',
  'fechasDisponiblesKardex',
  'seleccionarFechaPuntualKardex',
  'coincideFiltrosKanbanPro',
  'busquedaKanban',
  'filtrosKanbanPro',
  'activeView'
];

terms.forEach(t => {
  const count = (torre.match(new RegExp(t, 'g')) || []).length;
  console.log(`Term "${t}": ${count} occurrences in Torre.vue`);
});
