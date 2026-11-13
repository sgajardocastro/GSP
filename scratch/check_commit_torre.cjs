const { execSync } = require('child_process');

try {
  const content = execSync('git show 3bfabd7:ejecucion/frontend/src/views/Torre.vue', { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
  const lines = content.split('\n');
  console.log('Line count in 3bfabd7:', lines.length);

  const kfCount = lines.filter(l => l.includes('kanban_filtros')).length;
  console.log('Occurrences of kanban_filtros in 3bfabd7:', kfCount);

  const kardexCount = lines.filter(l => l.includes('kardex')).length;
  console.log('Occurrences of kardex in 3bfabd7:', kardexCount);
} catch (e) {
  console.error('Error:', e.message);
}
