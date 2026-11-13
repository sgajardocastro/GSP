const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkUser1() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT * FROM sch_leangsp_prod.tsec_user_roles WHERE id_user = 1;\\""`);
  console.log('Roles de id_user = 1:');
  console.log(res.stdout);

  ssh.dispose();
}

checkUser1().catch(console.error);
