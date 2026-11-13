const fs = require('fs');
fs.copyFileSync('ejecucion/frontend/src/views/Torre.vue', 'scratch/Torre_backup_current.vue');
console.log('Backed up Torre.vue to scratch/Torre_backup_current.vue');
