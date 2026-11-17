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
    SELECT id_rel_equipo, id_proyecto, id_equipo, id_linea_servicio, estado_real, observaciones
    FROM sch_leangsp.tpry_rel_equipo
    WHERE id_proyecto = 203
    ORDER BY id_rel_equipo;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/audit_p203.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/audit_p203.sql"`);
  console.log("Filas proyecto 203 en DEV:\n", res.stdout);
  await ssh.execCommand(`rm -f /tmp/audit_p203.sql`);

  ssh.dispose();
}

run().catch(console.error);
