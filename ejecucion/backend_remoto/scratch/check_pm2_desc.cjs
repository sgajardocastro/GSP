const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkPm2Desc() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('su - nodeadmin -c "pm2 desc 13"');
  console.log(res.stdout);

  ssh.dispose();
}

checkPm2Desc().catch(console.error);
