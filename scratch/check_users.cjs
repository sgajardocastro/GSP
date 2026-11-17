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

  const remoteScript = `
require('dotenv').config();
const pool = require('./src/config/postgresPool');

async function test() {
  try {
    const { rows: cols } = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tpry_rel_persona'");
    console.log('COLUMNS OF tpry_rel_persona:', cols.map(c => c.column_name + ' (' + c.data_type + ')'));
    
    const { rows: u } = await pool.query('SELECT id_user, name_frst, apellido_pat, email, rut, movil FROM tsec_users WHERE id_user IN (55, 12, 65)');
    console.log('USERS FOUND:', u);
  } catch (err) {
    console.error('QUERY ERR:', err);
  } finally {
    process.exit(0);
  }
}
test();
`;

  await ssh.execCommand("cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/test_users.js\n" + remoteScript + "\nEOF");
  await ssh.execCommand("chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/test_users.js");
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node test_users.js"');
  console.log('REMOTE STDOUT:\n', res.stdout);
  console.log('REMOTE STDERR:\n', res.stderr);
  await ssh.execCommand("rm -f /home/nodeadmin/proyectos/lean-services-gsp/test_users.js");
  ssh.dispose();
}

run().catch(console.error);
