const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectControllerHead() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmdHead = `head -n 15 /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/asignacionRecursosController.js`;
  const resHead = await ssh.execCommand(cmdHead);
  console.log('CONTROLLER HEAD:\n', resHead.stdout);

  ssh.dispose();
}

inspectControllerHead().catch(console.error);
