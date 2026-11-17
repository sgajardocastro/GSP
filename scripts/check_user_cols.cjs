const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkUserCols() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tsec_users';
SELECT id_user, email, id_rol FROM sch_leangsp_prod.tsec_users WHERE id_user = 10;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/query.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

checkUserCols().catch(console.error);
