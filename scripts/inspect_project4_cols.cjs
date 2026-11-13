const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectProjectCols() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const cmd = `su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tpry_proyecto' ORDER BY ordinal_position;\\""`;
  const res = await ssh.execCommand(cmd);
  console.log(res.stdout);

  ssh.dispose();
}

inspectProjectCols().catch(console.error);
