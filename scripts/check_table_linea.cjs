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
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'tpry_linea_servicio'
  AND table_schema IN ('sch_leangsp', 'sch_leangsp_prod');
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_table_linea.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_table_linea.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

main().catch(console.error);
