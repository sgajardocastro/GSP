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
    \\set ON_ERROR_STOP on
    \\x auto
    SELECT id_rel_equipo, id_proyecto, id_equipo, id_linea_servicio, rol_equipo, fecha_plan_ini, fecha_plan_fin, estado_real
    FROM sch_leangsp.tpry_rel_equipo 
    WHERE id_proyecto = 204;

    SELECT id_rel_persona, id_proyecto, id_user, id_linea_servicio, rol_asignado, fecha_plan_ini, fecha_plan_fin, estado_real
    FROM sch_leangsp.tpry_rel_persona 
    WHERE id_proyecto = 204;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/query_ots.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/query_ots.sql"`);
  console.log("STDOUT:\n", res.stdout);
  console.log("STDERR:\n", res.stderr);
  await ssh.execCommand(`rm -f /tmp/query_ots.sql`);

  ssh.dispose();
}

run().catch(console.error);
