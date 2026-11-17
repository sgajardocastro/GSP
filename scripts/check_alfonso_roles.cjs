const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkAllAlfonso() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
SELECT id_user, email, codi_user, name_frst, apellido_pat, json_data 
FROM sch_leangsp_prod.tsec_users 
WHERE LOWER(name_frst) LIKE '%alfonso%' OR LOWER(apellido_pat) LIKE '%porperello%';
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/query.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

checkAllAlfonso().catch(console.error);
