const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkOTVersions86() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  SELECT 
    id_proyecto, 
    jsonb_array_length(json_field->'ejecucion_v1'->'ot_versiones') as cant_versiones,
    json_field->'ejecucion_v1'->'ot_versiones'->-1 as ultima_ot
  FROM sch_leangsp_prod.tpry_proyecto 
  WHERE id_proyecto = 86;
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/q_ot_v86.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_ot_v86.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

checkOTVersions86().catch(console.error);
