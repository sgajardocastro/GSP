const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();
(async () => {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT table_schema, table_name FROM information_schema.tables WHERE (table_name LIKE \'%usuario%\' OR table_name LIKE \'%user%\') AND table_schema LIKE \'%gsp%\';\\""');
  console.log('TABLES IN GSP:\n', res.stdout, res.stderr);
  ssh.dispose();
})();
