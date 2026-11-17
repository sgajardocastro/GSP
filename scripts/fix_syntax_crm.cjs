const fs = require('fs');
const file = 'C:/temp/worktree_main/ejecucion/frontend/src/views/CRM/GestorOportunidades.vue';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const modoEstructurador = ref((typeof window !== 'undefined' && window.location.pathname.includes('/lg-gsp-prod')) ? 'clasico' : (localStorage.getItem('gsp_cotizador_modo') || 'clasico')) || 'clasico')",
  "const modoEstructurador = ref((typeof window !== 'undefined' && window.location.pathname.includes('/lg-gsp-prod')) ? 'clasico' : (localStorage.getItem('gsp_cotizador_modo') || 'clasico'))"
);

fs.writeFileSync(file, content, 'utf8');
console.log('✔ Syntax fixed');
