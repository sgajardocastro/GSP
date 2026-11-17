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
SELECT match[1] FROM (
  SELECT regexp_matches(json_field::text, '.{0,30}52.{0,30}', 'g') as match
  FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97
) s LIMIT 5;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_52.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_52.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
