const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('pdftotext "/u05/LeanDocs/GSP/prod/ot/2026/11/OT-GSP-2611-00027V6-184.pdf" -');
  console.log(res.stdout);

  ssh.dispose();
}

run().catch(console.error);
