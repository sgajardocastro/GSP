const fs = require('fs');
const content = fs.readFileSync('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5/.system_generated/steps/10598/output.txt', 'utf8');

const lines = content.split('\n');
console.log('Total lines in output:', lines.length);

lines.forEach((l, i) => {
  if (l.includes('Punto 1') || l.includes('Punto 2') || l.includes('Torre.vue') || l.includes('kardex') || l.includes('kanban_filtros')) {
    console.log(i, l.substring(0, 120));
  }
});
