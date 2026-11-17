const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectEDPEqGrouping() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `grep -n -C 20 "r.id_equipo" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/estadoPagoController.js | head -n 45`;
  const res = await ssh.execCommand(cmd);
  console.log('EDP CONTROLLER r.id_equipo:\n', res.stdout);

  ssh.dispose();
}

inspectEDPEqGrouping().catch(console.error);
