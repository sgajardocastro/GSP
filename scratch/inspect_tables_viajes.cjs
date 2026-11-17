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

  const sql = `
SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_name ILIKE '%viaje%';
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_tables_viajes.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_tables_viajes.sql"');
  console.log('STDOUT:\n', res.stdout);

  ssh.dispose();
}

run().catch(console.error);
