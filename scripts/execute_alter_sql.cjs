const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('Uploading alter_constraints.sql...');
  await ssh.putFile('scripts/alter_constraints.sql', '/tmp/alter_constraints.sql');

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/alter_constraints.sql"');
  console.log('psql stdout:\n', res.stdout);
  console.log('psql stderr:\n', res.stderr);

  await ssh.execCommand('rm -f /tmp/alter_constraints.sql');
  ssh.dispose();
}

main().catch(console.error);
