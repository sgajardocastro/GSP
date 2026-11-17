const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectV10FullPdftotext() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('pdftotext /u05/LeanDocs/GSP/prod/ot/2026/11/OT-GSP-2611-00047V11-253.pdf - | grep -i "CPYW"');
  console.log('ANY CPYW FOUND IN V11?:\n', res.stdout ? res.stdout : 'NINGUNO (CERO CPYW)');

  ssh.dispose();
}

inspectV10FullPdftotext().catch(console.error);
