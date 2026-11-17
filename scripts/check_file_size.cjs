const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkFileSize() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('ls -la /u05/LeanDocs/GSP/prod/ot/2026/11/OT-GSP-2611-00047V11-253.pdf');
  console.log('FILE:\n', res.stdout);

  const resPdf = await ssh.execCommand(`python3 -c "
with open('/u05/LeanDocs/GSP/prod/ot/2026/11/OT-GSP-2611-00047V11-253.pdf', 'rb') as f:
    data = f.read()
    print('Size bytes:', len(data))
    for term in [b'VYRK', b'CPYW', b'Saavedra', b'Opazo', b'Mercado', b'RWJL']:
        print(term.decode(), 'found:', term in data)
"`);
  console.log(resPdf.stdout);

  ssh.dispose();
}

checkFileSize().catch(console.error);
