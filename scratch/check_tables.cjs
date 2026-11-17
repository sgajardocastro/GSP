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
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'sch_leangsp' AND table_name LIKE '%ot%';
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/check_tables.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/check_tables.sql"`);
  console.log("Tablas OT:\n", res.stdout || res.stderr);
  await ssh.execCommand(`rm -f /tmp/check_tables.sql`);

  ssh.dispose();
}

run().catch(console.error);
