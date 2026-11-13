const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectOmar() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_user, name_frst, email, json_data FROM sch_leangsp.tsec_users WHERE id_user = 66;\\""');
  console.log(res.stdout);

  ssh.dispose();
}

inspectOmar().catch(console.error);
