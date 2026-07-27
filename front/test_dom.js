const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const virtualConsole = new VirtualConsole();
virtualConsole.sendTo(console);

try {
  const html = fs.readFileSync('maqueta_gsp_final.html', 'utf8');
  const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", virtualConsole });
  
  dom.window.addEventListener('load', () => {
    console.log("JSDOM window 'load' fired!");
    console.log("window.switchView is:", typeof dom.window.switchView);
    console.log("window.updateCharts is:", typeof dom.window.updateCharts);
    console.log("window.openModal is:", typeof dom.window.openModal);
    console.log("window.switchDossierTab is:", typeof dom.window.switchDossierTab);
  });

  // Keep process alive for a bit to let async load happen
  setTimeout(() => {
    console.log("Timeout check after 3 seconds:");
    console.log("window.switchView is:", typeof dom.window.switchView);
    console.log("window.updateCharts is:", typeof dom.window.updateCharts);
    console.log("window.openModal is:", typeof dom.window.openModal);
    console.log("window.switchDossierTab is:", typeof dom.window.switchDossierTab);
  }, 3000);

} catch (e) {
  console.error("Error loading JSDOM:", e);
}



