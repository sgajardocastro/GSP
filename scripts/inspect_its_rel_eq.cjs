const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectItsRelEquipos() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `grep -n -C 5 "tpry_rel_equipo" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js`;
  const res = await ssh.execCommand(cmd);
  console.log('TPRY_REL_EQUIPO IN ITS CONTROLLER:\n', res.stdout);

  ssh.dispose();
}

inspectItsRelEquipos().catch(console.error);
