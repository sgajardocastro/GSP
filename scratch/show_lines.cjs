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

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -f /tmp/query_p74_jf.sql"');
  const lines = res.stdout.split('\n');
  console.log(lines.slice(1050, 1110).join('\n'));

  ssh.dispose();
}

run().catch(console.error);
