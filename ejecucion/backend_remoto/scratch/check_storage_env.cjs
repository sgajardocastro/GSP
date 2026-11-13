const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkEnv() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep STORAGE /home/nodeadmin/proyectos/lean-services-gsp-prod/.env /home/nodeadmin/proyectos/lean-services-gsp/.env');
  console.log(res.stdout);

  ssh.dispose();
}

checkEnv().catch(console.error);
