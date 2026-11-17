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

  // Extract around the select for the crane
  const res = await ssh.execCommand('grep -o ".\\{0,200\\}Equipo Mayor Capacidad (Tarifa Respaldada)" /var/www/html/lg-gsp-prod/assets/index-B91sdtdb.js');
  console.log('SELECT SNIPPET:\n', res.stdout);

  ssh.dispose();
}

run().catch(console.error);
