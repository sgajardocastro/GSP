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

  const resPm2 = await ssh.execCommand('su - nodeadmin -c "pm2 jlist"');
  const list = JSON.parse(resPm2.stdout);
  console.log(list.map(p => ({ id: p.pm_id, name: p.name, status: p.pm2_env.status, port: p.pm2_env.env?.PORT, path: p.pm2_env.pm_cwd })));

  ssh.dispose();
}

main().catch(console.error);