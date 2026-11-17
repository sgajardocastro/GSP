const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkOTVersions() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  SELECT json_field->'ejecucion_v1'->'ot_versiones' as ot_versiones
  FROM sch_leangsp_prod.tpry_proyecto
  WHERE id_proyecto = 101;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/chk_ot.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/chk_ot.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

checkOTVersions().catch(console.error);
