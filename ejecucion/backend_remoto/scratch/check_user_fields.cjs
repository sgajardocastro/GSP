const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkUserFields() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_user, codi_user, rut, email, name_frst, apellido_pat, pass_hash_fes, flag_proc_enrol FROM sch_leangsp_prod.tsec_users WHERE id_user = 1;\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

checkUserFields().catch(console.error);
