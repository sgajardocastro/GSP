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
    const { rows: cols } = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tequ_equipo'");
    console.log('COLUMNS OF tequ_equipo:', cols.map(c => c.column_name));
  } catch (err) {
    console.error('QUERY ERR:', err);
  } finally {
    process.exit(0);
  }
}
test();
`;

  await ssh.execCommand("cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/test_cols.js\n" + remoteScript + "\nEOF");
  await ssh.execCommand("chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/test_cols.js");
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node test_cols.js"');
  console.log('COLUMNS:\n', res.stdout);
  await ssh.execCommand("rm -f /home/nodeadmin/proyectos/lean-services-gsp/test_cols.js");
  ssh.dispose();
}

run().catch(console.error);
