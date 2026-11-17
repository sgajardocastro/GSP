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

  const nodeScript = `
const fs = require('fs');
const content = fs.readFileSync('/var/www/html/lg-gsp-prod/assets/index-B91sdtdb.js', 'utf8');
const target = 'Equipo Mayor Capacidad (Tarifa Respaldada)';
const idx = content.indexOf(target);
if (idx !== -1) {
  console.log('SELECT DEFINITION:');
  console.log(content.substring(Math.max(0, idx - 1400), idx - 300));
}
`;
  await ssh.execCommand("cat << 'EOF' > /tmp/read_snippet2.js\n" + nodeScript + "\nEOF");
  const res = await ssh.execCommand('node /tmp/read_snippet2.js');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
