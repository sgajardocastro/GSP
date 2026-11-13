const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand("sed -n '247,290p' /home/nodeadmin/proyectos/gsp-whatsapp-service/server.js");
  console.log('Endpoint /reiniciar in server.js:\n', res.stdout);

  ssh.dispose();
}

check().catch(console.error);
