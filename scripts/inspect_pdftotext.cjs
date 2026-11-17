const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectV10Pdftotext() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('pdftotext /u05/LeanDocs/GSP/prod/ot/2026/11/OT-GSP-2611-00047V11-253.pdf - | grep -E "VYRK|CPYW|Saavedra|Opazo|Mercado|RWJL"');
  console.log('PDFTEXT MATCHES:\n', res.stdout);

  ssh.dispose();
}

inspectV10Pdftotext().catch(console.error);
