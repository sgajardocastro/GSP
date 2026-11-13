const fs = require('fs');
const content = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');
const lines = content.split('\n');

console.log('Total lines in current Torre.vue:', lines.length);

lines.forEach((l, idx) => {
  if (l.includes('<template>') || l.includes('</template>') || l.includes('<script setup>') || l.includes('</script>') || l.includes('<style scoped>') || l.includes('</style>')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
  if (l.includes("activeView === 'kanban'") || l.includes("activeView === 'pmo'") || l.includes("activeView === 'gantt'") || l.includes("activeView === 'contabilidad'")) {
    console.log('  ' + (idx + 1) + ': ' + l.trim());
  }
});
