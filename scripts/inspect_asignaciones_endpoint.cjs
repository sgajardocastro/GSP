const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectAsignaciones() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `curl -s http://localhost:3013/api/proyectos/97/asignaciones/equipos`;
  const res = await ssh.execCommand(cmd);
  console.log('ENDPOINT /api/proyectos/97/asignaciones/equipos:\n', res.stdout);

  const cmdCat = `grep -n -C 15 "getAsignacionesEquipo" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/asignacionRecursosController.js`;
  const resCat = await ssh.execCommand(cmdCat);
  console.log('CONTROLLER CODE:\n', resCat.stdout);

  ssh.dispose();
}

inspectAsignaciones().catch(console.error);
