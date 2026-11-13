const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkUsers() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `SELECT id_user, name_frst, apellido_pat, email, movil FROM sch_leangsp.tsec_users WHERE email ILIKE '%ghiselini%' OR email ILIKE '%yiara%' OR name_frst ILIKE '%omar%' OR name_frst ILIKE '%yiara%';`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/users_query.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand("su - postgres -c 'psql -d postgres -t -A -F \" | \" -f /tmp/users_query.sql'");
  console.log(res.stdout);
  ssh.dispose();
}

checkUsers().catch(console.error);
