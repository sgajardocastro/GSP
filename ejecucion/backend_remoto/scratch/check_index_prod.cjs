const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkIndex() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep "<script" /var/www/html/lg-gsp-prod/index.html');
  console.log('Scripts en PROD index.html:');
  console.log(res.stdout);

  ssh.dispose();
}

checkIndex().catch(console.error);
