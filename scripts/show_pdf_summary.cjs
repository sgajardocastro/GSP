const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function showPdfSummary() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('pdftotext /u05/LeanDocs/GSP/prod/ot/2026/11/OT-GSP-2611-00047V11-253.pdf -');
  const lines = res.stdout.split('\n');
  const filtered = lines.filter(l => 
    l.includes('VYRK') || l.includes('CPYW') || l.includes('SAAVEDRA') || 
    l.includes('OPAZO') || l.includes('MERCADO') || l.includes('RWJL') ||
    l.includes('EQUIPO') || l.includes('PATENTE') || l.includes('V11') || l.includes('Versión')
  );
  console.log('RELEVANT PDF V11 LINES:');
  console.log(filtered.join('\n'));

  ssh.dispose();
}

showPdfSummary().catch(console.error);
