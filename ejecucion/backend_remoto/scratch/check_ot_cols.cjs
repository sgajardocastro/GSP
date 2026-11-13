const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();
async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = \'sch_leangsp\' AND table_name = \'tmnt_ot\' ORDER BY ordinal_position;\\""');
  console.log(res.stdout);
  ssh.dispose();
}
main().catch(console.error);
