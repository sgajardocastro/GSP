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

  const cmd = `curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/its/preview-pdf/74 -o /tmp/its28_preview.pdf && pdftotext /tmp/its28_preview.pdf - | grep -E -i "tlxf|gallardo|skyj|beltran|rkvz"`;
  const res = await ssh.execCommand(cmd);
  console.log('Matches in generated ITS PDF:\n', res.stdout);

  ssh.dispose();
}

run().catch(console.error);
