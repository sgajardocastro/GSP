const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkSergio() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_user, codi_user, rut, email, name_frst, apellido_pat FROM sch_leangsp_prod.tsec_users WHERE email ILIKE '%sgajardo%' OR email ILIKE '%gmail%';\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

checkSergio().catch(console.error);
