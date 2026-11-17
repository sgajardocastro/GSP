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

  // Query latest OT version for project 204 in DB
  const sql = `
    SELECT id_version_ot, version, fecha_emision, url_pdf, total_equipos, tripulacion_count
    FROM sch_leangsp.tpry_version_ot
    WHERE id_proyecto = 204
    ORDER BY id_version_ot DESC LIMIT 5;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/check_ot_db.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/check_ot_db.sql"`);
  console.log("Versiones OT para proyecto 204:\n", res.stdout);
  await ssh.execCommand(`rm -f /tmp/check_ot_db.sql`);

  ssh.dispose();
}

run().catch(console.error);
