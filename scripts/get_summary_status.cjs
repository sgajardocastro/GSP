const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res1 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c '\\d sch_leangsp_prod.tcfg_backlog'\"");
  console.log('--- COLUMNS BACKLOG ---');
  console.log(res1.stdout);

  const res2 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c '\\d sch_leangsp_prod.tcfg_releases'\"");
  console.log('--- COLUMNS RELEASES ---');
  console.log(res2.stdout);

  ssh.dispose();
}

run().catch(console.error);
