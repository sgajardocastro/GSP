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
SELECT * FROM sch_leangsp_prod.tits_informe_termino WHERE id_proyecto = 74;
SELECT * FROM sch_leangsp_prod.tpry_viajes WHERE id_proyecto = 74;
SELECT * FROM sch_leangsp_prod.tpry_rel_trabajador WHERE id_proyecto = 74;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_p74_search.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_p74_search.sql"');
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  ssh.dispose();
}

run().catch(console.error);
