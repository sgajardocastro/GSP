const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const nodeScript = `
    const fs = require('fs');
    const content = fs.readFileSync('/var/www/html/lg-gsp-prod/assets/index-B1pouAdp.js', 'utf8');
    const pos = content.indexOf('Report Diario Digital — Día');
    console.log(content.substring(pos - 600, pos));
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/search_render.js\n${nodeScript}\nEOF`);
  const res = await ssh.execCommand(`node /tmp/search_render.js`);
  console.log(res.stdout);
  ssh.dispose();
}
main().catch(console.error);
