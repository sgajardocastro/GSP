const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDocFilesPhysical() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `ls -la /u05/LeanDocs/GSP/prod/reports/2026/11/*1794592573265* /u05/LeanDocs/GSP/prod/reports/2026/11/*1794602396819* 2>/dev/null`;
  const res = await ssh.execCommand(cmd);
  console.log('PHYSICAL FILES:\n', res.stdout);

  // Check text of 1929
  const resPdf = await ssh.execCommand('pdftotext /u05/LeanDocs/GSP/prod/reports/2026/11/Report_Diario_OT_GSP-2611-00004_D12_1794592573265.pdf - | head -n 30');
  console.log('PDF 1929 TEXT:\n', resPdf.stdout);

  ssh.dispose();
}

inspectDocFilesPhysical().catch(console.error);
