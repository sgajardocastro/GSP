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
    \\d sch_leangsp.tcfg_releases
    SELECT * FROM sch_leangsp.tcfg_releases ORDER BY 1 DESC LIMIT 5;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/check_rel.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/check_rel.sql"`);
  console.log("Schema y registros:\n", res.stdout || res.stderr);
  await ssh.execCommand(`rm -f /tmp/check_rel.sql`);

  ssh.dispose();
}

run().catch(console.error);
