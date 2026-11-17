const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkProdEnv() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep -E "DB_SCHEMA|DB_USER" /home/nodeadmin/proyectos/lean-services-gsp-prod/.env');
  console.log(res.stdout);

  ssh.dispose();
}

checkProdEnv().catch(console.error);
