const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const out = await ssh.execCommand("cat /home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/index.js");
  console.log(out.stdout);
  ssh.dispose();
}

run().catch(console.error);
