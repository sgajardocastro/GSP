const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkUsers() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_user, codi_user, rut, email, flag_proc_enrol, activo FROM sch_leangsp_prod.tsec_users WHERE email ILIKE '%lguser%' OR codi_user ILIKE '%lguser%' OR rut ILIKE '%12345678-9%';\\""`);
  console.log('Usuarios lguser en prod:');
  console.log(res.stdout);

  ssh.dispose();
}

checkUsers().catch(console.error);
