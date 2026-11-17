const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectGuardarReportEq() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `sed -n '1690,1750p' /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js`;
  const res = await ssh.execCommand(cmd);
  console.log('GUARDAR REPORT DIARIO EQ RESOLUTION:\n', res.stdout);

  ssh.dispose();
}

inspectGuardarReportEq().catch(console.error);
