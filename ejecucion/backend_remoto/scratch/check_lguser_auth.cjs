const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- USER 1 EN PROD ---');
  const uProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_user, email, name_frst, apellido_pat FROM sch_leangsp_prod.tsec_users WHERE id_user = 1;\\""`);
  console.log(uProd.stdout);
  if (uProd.stderr) console.error('STDERR PROD:', uProd.stderr);

  console.log('--- USER 59 EN DEV ---');
  const uDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_user, email, name_frst, apellido_pat FROM sch_leangsp.tsec_users WHERE id_user = 59;\\""`);
  console.log(uDev.stdout);
  if (uDev.stderr) console.error('STDERR DEV:', uDev.stderr);

  ssh.dispose();
}

run();
