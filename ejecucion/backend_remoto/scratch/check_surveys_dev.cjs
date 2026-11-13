const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- SURVEYS EN DEV (sch_leangsp) ---');
  const srvDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_survey, id_template, id_user, id_proyecto, estado_srv FROM sch_leangsp.tsrv_survey WHERE id_template = 80;\\""`);
  console.log(srvDev.stdout);

  ssh.dispose();
}

run();
