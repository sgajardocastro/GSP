const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const r = await ssh.execCommand('sudo -u postgres psql -d postgres -c "SELECT id_user, name_frst, apellido_pat, email, rut FROM sch_leangsp_prod.tsec_users WHERE id_user = 45;"');
  console.log('NICOLAS CEBALLOS:\n', r.stdout);

  ssh.dispose();
}

run().catch(console.error);
