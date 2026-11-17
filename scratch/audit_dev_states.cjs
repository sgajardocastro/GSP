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
    SELECT id_proyecto, estado_real, count(*) 
    FROM sch_leangsp.tpry_rel_equipo 
    GROUP BY id_proyecto, estado_real 
    ORDER BY id_proyecto DESC;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/audit_reemplazados.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/audit_reemplazados.sql"`);
  console.log("Estados en tpry_rel_equipo en DEV:\n", res.stdout);
  await ssh.execCommand(`rm -f /tmp/audit_reemplazados.sql`);

  ssh.dispose();
}

run().catch(console.error);
