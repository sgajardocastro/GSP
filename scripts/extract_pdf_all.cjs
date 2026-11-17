const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function extractAll() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const resText = await ssh.execCommand(`python3 -c "
import pypdf
reader = pypdf.PdfReader('/u05/LeanDocs/GSP/prod/ot/2026/11/OT-GSP-2611-00047V11-253.pdf')
for i, page in enumerate(reader.pages):
    print(f'--- PAGE {i} ---')
    print(page.extract_text()[:600])
"`);
  console.log('PDF TEXT:\n', resText.stdout);
  ssh.dispose();
}

extractAll().catch(console.error);
