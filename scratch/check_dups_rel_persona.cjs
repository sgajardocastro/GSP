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
    SELECT id_proyecto, id_user, COUNT(*) as cant, array_agg(id_rel_persona) as ids_rel, array_agg(id_linea_servicio) as lineas
    FROM sch_leangsp.tpry_rel_persona
    WHERE COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
    GROUP BY id_proyecto, id_user
    HAVING COUNT(*) > 1
    ORDER BY id_proyecto DESC;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/check_dups_p.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/check_dups_p.sql"`);
  console.log("Duplicados en tpry_rel_persona:\n", res.stdout);
  await ssh.execCommand(`rm -f /tmp/check_dups_p.sql`);

  ssh.dispose();
}

run().catch(console.error);
