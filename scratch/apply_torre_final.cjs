const fs = require('fs');

const finalContent = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
fs.writeFileSync('ejecucion/frontend/src/views/Torre.vue', finalContent, 'utf8');
console.log('Applied finalContent to ejecucion/frontend/src/views/Torre.vue. Length:', finalContent.length);
