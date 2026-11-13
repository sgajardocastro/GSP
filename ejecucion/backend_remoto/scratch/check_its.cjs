const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const sqlIts = `SELECT * FROM sch_leangsp_prod.tits_informe_termino LIMIT 10;`;
  const resIts = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlIts}\\""`);
  console.log('ALL ITS PROD:\n', resIts.stdout);
  console.log('STDERR:\n', resIts.stderr);

  const resItsDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT * FROM sch_leangsp.tits_informe_termino LIMIT 10;\\""`);
  console.log('ALL ITS DEV:\n', resItsDev.stdout);

  ssh.dispose();
}

run().catch(console.error);
