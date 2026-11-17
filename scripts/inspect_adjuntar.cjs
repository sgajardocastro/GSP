const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDocAdjuntoRoute() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `grep -n -C 20 "adjuntar-documento" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/*.js || grep -n -C 20 "adjuntarDocumento" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/*.js`;
  const res = await ssh.execCommand(cmd);
  console.log('ADJUNTAR DOCUMENTO ROUTE:\n', res.stdout.slice(0, 1500));

  ssh.dispose();
}

inspectDocAdjuntoRoute().catch(console.error);
