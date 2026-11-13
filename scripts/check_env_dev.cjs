const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkEnv() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/.env');
  console.log('ENV DEV:\n', res.stdout.replace(/PASSWORD=.*/gi, 'PASSWORD=***'));

  ssh.dispose();
}

checkEnv().catch(console.error);
