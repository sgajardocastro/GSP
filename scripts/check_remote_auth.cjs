const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkLoginGoogleProd() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('sed -n "345,395p" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/authController.js');
  console.log(res.stdout);

  ssh.dispose();
}

checkLoginGoogleProd().catch(console.error);
