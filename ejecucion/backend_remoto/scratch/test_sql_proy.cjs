const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const res = await ssh.execCommand('su - nodeadmin -c "pm2 logs 10 --lines 40 --nostream"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
