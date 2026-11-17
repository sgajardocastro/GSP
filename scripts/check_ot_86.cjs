const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkOTTable() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'sch_leangsp_prod' AND table_name LIKE '%ot%';
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/q_ot_tables.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_ot_tables.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

checkOTTable().catch(console.error);
