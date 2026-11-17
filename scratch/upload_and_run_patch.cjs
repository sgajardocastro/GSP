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

  await ssh.putFile(path.resolve(__dirname, 'patch_pwa.py'), '/tmp/patch_pwa.py');
  const res = await ssh.execCommand('python3 /tmp/patch_pwa.py');
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  await ssh.execCommand('rm -f /tmp/patch_pwa.py');

  ssh.dispose();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
