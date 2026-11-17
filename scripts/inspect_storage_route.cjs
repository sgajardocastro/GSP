const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectArchiveRoute() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('grep -rn "storage/view" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/');
  console.log('STORAGE VIEW IN SRC:\n', res.stdout);

  const res2 = await ssh.execCommand('grep -rn "tdoc_" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/ || grep -rn "storage" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/');
  console.log('STORAGE IN SRC:\n', res2.stdout.slice(0, 500));

  ssh.dispose();
}

inspectArchiveRoute().catch(console.error);
