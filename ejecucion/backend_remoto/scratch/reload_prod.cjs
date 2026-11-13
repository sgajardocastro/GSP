const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function reloadProd() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');
  console.log(res.stdout);

  const resStatus = await ssh.execCommand('su - nodeadmin -c "pm2 list"');
  console.log(resStatus.stdout);

  ssh.dispose();
}

reloadProd().catch(console.error);
