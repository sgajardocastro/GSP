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

async function checkLocks() {
  const { rows } = await pool.query("SELECT pid, state, query, wait_event_type, wait_event, age(clock_timestamp(), query_start) as duration FROM pg_stat_activity WHERE state != 'idle' AND pid != pg_backend_pid()");
  console.log('ACTIVE QUERIES/LOCKS:', rows);
  process.exit(0);
}
checkLocks().catch(e => { console.error('ERROR:', e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/check_locks.js\n" + remoteScript + "\nEOF");
  await ssh.execCommand("chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/check_locks.js");
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node check_locks.js"');
  console.log('REMOTE OUTPUT:\n', res.stdout || res.stderr);

  await ssh.execCommand("rm -f /home/nodeadmin/proyectos/lean-services-gsp/check_locks.js");
  ssh.dispose();
}

run().catch(console.error);
