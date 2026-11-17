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
const target = '.equipo_asignado_id=';
let pos = 0;
while (true) {
  const idx = content.indexOf(target, pos);
  if (idx === -1) break;
  console.log('Assignment at:', idx);
  console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 200)));
  console.log('---');
  pos = idx + target.length;
}
`;
  await ssh.execCommand("cat << 'EOF' > /tmp/search_eq_assign.js\n" + nodeScript + "\nEOF");
  const res = await ssh.execCommand('node /tmp/search_eq_assign.js');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
