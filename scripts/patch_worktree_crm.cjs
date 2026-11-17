const fs = require('fs');
const file = 'C:/temp/worktree_main/ejecucion/frontend/src/views/CRM/GestorOportunidades.vue';
let content = fs.readFileSync(file, 'utf8');

// Replace using regex
content = content.replace(
  /const modoEstructurador = ref\([^)]+\)/,
  "const modoEstructurador = ref((typeof window !== 'undefined' && window.location.pathname.includes('/lg-gsp-prod')) ? 'clasico' : (localStorage.getItem('gsp_cotizador_modo') || 'clasico'))"
);

content = content.replace(
  /const puedeUsarEstructuradorArbol = computed\(\(\) => \{[\s\S]*?return Boolean\(isDevEnv \|\| isGerenciaOAdmin\)\s*\n\s*\}\)/,
  `const puedeUsarEstructuradorArbol = computed(() => {
  if (typeof window !== 'undefined' && window.location.pathname.includes('/lg-gsp-prod')) {
    return false
  }
  const isDevEnv = Boolean(
    import.meta.env.DEV || 
    (typeof window !== 'undefined' && (
      window.location.pathname.includes('/lg-gsp-dev') || 
      localStorage.getItem('gsp_enable_tree_cotizador') === 'true'
    ))
  )
  const u = JSON.parse(localStorage.getItem('user') || '{}')
  const email = String(u.email || u.correo || '').toLowerCase().trim()
  const isGerenciaOAdmin = ['jponce@arriendosanpablo.cl', 'sgajardoc@gmail.com'].includes(email) || esUsuarioAdministrador.value
  return Boolean(isDevEnv && isGerenciaOAdmin)
})`
);

fs.writeFileSync(file, content, 'utf8');
console.log('✔ GestorOportunidades.vue patched in worktree_main successfully');
