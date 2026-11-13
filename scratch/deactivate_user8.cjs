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

  const sql = `
    UPDATE sch_leangsp_prod.tsec_users SET activo = false WHERE id_user = 8;
    UPDATE sch_leangsp.tsec_users SET activo = false WHERE id_user = 8;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout);

  ssh.dispose();
  console.log('Duplicate user 8 deactivated cleanly.');
}

main().catch(console.error);
