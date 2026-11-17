const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectEDPMultipleEquipos() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `grep -n -C 15 "const hrsAplicar = totalHorasFact" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/estadoPagoController.js`;
  const res = await ssh.execCommand(cmd);
  console.log('HOURS MULTIPLIER IN EDP:\n', res.stdout);

  ssh.dispose();
}

inspectEDPMultipleEquipos().catch(console.error);
