const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkTables() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_name LIKE '%its%';
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_tables.sql\n${q}\nEOF`);
  const r = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_tables.sql"');
  console.log(r.stdout);
  ssh.dispose();
}
checkTables().catch(console.error);
