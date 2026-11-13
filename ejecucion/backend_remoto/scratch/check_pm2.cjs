const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkPm2() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('pm2 list');
  console.log(res.stdout);

  ssh.dispose();
}

checkPm2().catch(console.error);
