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
SELECT jsonb_pretty(json_field->'control_vivo_overrides')
FROM sch_leangsp_prod.tpry_proyecto
WHERE id_proyecto = 74;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_p74_cvo.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -f /tmp/query_p74_cvo.sql"');
  console.log('CVO:', res.stdout);

  ssh.dispose();
}

run().catch(console.error);
