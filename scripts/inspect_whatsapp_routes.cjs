const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand("grep -n -E 'app\\.(get|post)' /home/nodeadmin/proyectos/gsp-whatsapp-service/server.js");
  console.log('Routes in server.js:\n', res.stdout);

  const resStatus = await ssh.execCommand("curl -s http://127.0.0.1:3085/status || curl -s http://127.0.0.1:3085/qr || curl -s http://127.0.0.1:3085/");
  console.log('HTTP response:\n', resStatus.stdout);

  ssh.dispose();
}

check().catch(console.error);
