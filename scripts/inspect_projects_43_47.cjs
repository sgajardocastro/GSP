const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkAllStates() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
SELECT id_proyecto_estado, count(*) 
FROM sch_leangsp_prod.tpry_proyecto 
GROUP BY id_proyecto_estado 
ORDER BY id_proyecto_estado;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/query.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

checkAllStates().catch(console.error);
