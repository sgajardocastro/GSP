const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDoc1929Equipo() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const resPdf = await ssh.execCommand('pdftotext /u05/LeanDocs/GSP/prod/reports/2026/11/Report_Diario_OT_GSP-2611-00004_D12_1794592573265.pdf - | grep -E "RSPL|TRPS|56|57|Patente|PATENTE|EQUIPO|Equipo"');
  console.log('PDF 1929 EQUIPO MATCHES:\n', resPdf.stdout);

  ssh.dispose();
}

inspectDoc1929Equipo().catch(console.error);
