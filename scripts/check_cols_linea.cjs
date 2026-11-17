const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
SELECT table_schema, table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('tpry_rel_equipo', 'tpry_rel_persona')
  AND table_schema IN ('sch_leangsp', 'sch_leangsp_prod')
ORDER BY table_schema, table_name, column_name;
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_cols_linea.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_cols_linea.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

main().catch(console.error);
