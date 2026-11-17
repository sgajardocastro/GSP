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
SELECT key, value::text
FROM sch_leangsp_prod.tpry_proyecto,
jsonb_each(json_field)
WHERE id_proyecto = 97 AND value::text LIKE '%equipo_asignado_id": 52%';
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/find_key_52.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/find_key_52.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
