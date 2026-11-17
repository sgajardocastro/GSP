const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `SELECT id_user_modificacion, fecha_modificacion FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97;`;
  await ssh.execCommand("cat << 'EOF' > /tmp/check_mod.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_mod.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
