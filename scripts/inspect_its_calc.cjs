const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectItsEqCalculation() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `sed -n '580,640p' /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js`;
  const res = await ssh.execCommand(cmd);
  console.log('ITS EQ CALCULATION:\n', res.stdout);

  ssh.dispose();
}

inspectItsEqCalculation().catch(console.error);
