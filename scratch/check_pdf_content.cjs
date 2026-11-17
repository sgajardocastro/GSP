const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('find /home/nodeadmin/ -name "OT-GSP-2611-00049V3-188.pdf"');
  console.log('FIND RESULT:\n', res.stdout);

  if (res.stdout.trim()) {
    const pdfPath = res.stdout.trim().split('\n')[0];
    const resTxt = await ssh.execCommand(`pdftotext "${pdfPath}" -`);
    console.log('=== PDF CONTENT ===\n', resTxt.stdout || resTxt.stderr);
  }

  ssh.dispose();
}

run().catch(console.error);
