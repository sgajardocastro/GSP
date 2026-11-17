const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDocFilesDirect() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('ls -la /u05/LeanDocs/GSP/prod/report/2026/11/*1929* /u05/LeanDocs/GSP/prod/report/2026/11/*1943* 2>/dev/null || ls -la /u05/LeanDocs/ 2>/dev/null');
  console.log('DOC FILES:\n', res.stdout);

  ssh.dispose();
}

inspectDocFilesDirect().catch(console.error);
