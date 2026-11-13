const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const res = await ssh.execCommand('grep -rn "pwa" /etc/nginx/');
  console.log(res.stdout);
  ssh.dispose();
}

run();
