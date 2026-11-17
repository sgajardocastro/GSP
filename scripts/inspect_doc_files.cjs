const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDocFiles() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('find / -name "*1929*" -o -name "*1943*" 2>/dev/null | grep -E "LeanDocs|upload|storage"');
  console.log('DOC FILES:\n', res.stdout);

  ssh.dispose();
}

inspectDocFiles().catch(console.error);
