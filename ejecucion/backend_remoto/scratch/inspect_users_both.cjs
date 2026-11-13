const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- USUARIOS EN PROD ---');
  const u = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_user, email, email_alternativo, name_frst, apellido_pat, codi_user FROM sch_leangsp_prod.tsec_users;\\""`);
  console.log(u.stdout);

  console.log('--- USUARIOS EN DEV ---');
  const uDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_user, email, email_alternativo, name_frst, apellido_pat, codi_user FROM sch_leangsp.tsec_users WHERE email LIKE '%sanpablo%' OR email LIKE '%gajardo%';\\""`);
  console.log(uDev.stdout);

  ssh.dispose();
}

run();
