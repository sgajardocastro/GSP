const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `SELECT id_user, name_frst, apellido_pat, rut, email, activo FROM sch_leangsp_prod.tsec_users;`;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
  console.log('STDOUT:', res.stdout);
  console.log('STDERR:', res.stderr);

  ssh.dispose();
}

main().catch(console.error);