const fs = require('fs');

const chunks = JSON.parse(fs.readFileSync('scratch/transcript_chunks.json', 'utf8'));

// Check which chunk has kardex template
Object.keys(chunks).forEach(step => {
  const text = chunks[step];
  if (text.includes("activeView === 'kardex'") || text.includes('activeView === "kardex"')) {
    console.log(`Step ${step} contains activeView === kardex! Length: ${text.length}`);
  }
  if (text.includes("activeView === 'kanban_filtros'") || text.includes('activeView === "kanban_filtros"')) {
    console.log(`Step ${step} contains activeView === kanban_filtros! Length: ${text.length}`);
  }
  if (text.includes('fechasDisponiblesKardex')) {
    console.log(`Step ${step} contains fechasDisponiblesKardex! Length: ${text.length}`);
  }
});
