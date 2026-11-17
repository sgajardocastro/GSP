const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectAdjuntarDocInReport() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `grep -n -C 20 "adjuntar" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/reportDiarioRoutes.js || grep -n -C 20 "adjuntar" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js`;
  const res = await ssh.execCommand(cmd);
  console.log('ADJUNTAR EN REPORT DIARIO:\n', res.stdout.slice(0, 1500));

  ssh.dispose();
}

inspectAdjuntarDocInReport().catch(console.error);
