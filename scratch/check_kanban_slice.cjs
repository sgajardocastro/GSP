const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');

const kanbanComment = '    <!-- Kanban Columns (6 Columnas Operativas) -->';
const pmoComment = '    <!-- Vista 2: Torre PMO de Control de Gestión & Auditoría Operacional-Financiera -->';

const idx1 = currentTorre.indexOf(kanbanComment);
const idx2 = currentTorre.indexOf(pmoComment);

console.log('idx1:', idx1, 'idx2:', idx2, 'diff:', idx2 - idx1);

const oldKanban = currentTorre.slice(idx1, idx2);
console.log('oldKanban starts with:', oldKanban.slice(0, 100));
console.log('oldKanban ends with:', oldKanban.slice(-100));
