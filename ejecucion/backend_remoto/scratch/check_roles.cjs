const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();
(async () => {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const res = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT column_name FROM information_schema.columns WHERE table_schema = \\\"sch_leangsp\\\" AND table_name = \\\"tsec_roles\\\";'\"");
  console.log('COLUMNS:\n', res.stdout, res.stderr);
  const res2 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT * FROM sch_leangsp.tsec_roles;'\"");
  console.log('SELECT *:\n', res2.stdout, res2.stderr);
  ssh.dispose();
})();
