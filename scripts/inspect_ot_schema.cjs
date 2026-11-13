const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkOtSchema() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c '\\d sch_leangsp_prod.tmnt_ot'"` );
  console.log('sch_leangsp_prod.tmnt_ot schema:\n', res.stdout);

  ssh.dispose();
}

checkOtSchema().catch(console.error);
