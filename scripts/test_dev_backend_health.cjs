const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();
async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const curl3006 = await ssh.execCommand('curl -s -w "\nHTTP_STATUS:%{http_code}" "http://127.0.0.1:3006/api/operaciones/control-vivo"');
  console.log('DEV Backend 3006:\n', curl3006.stdout.slice(-150));
  const curl3016 = await ssh.execCommand('curl -s -w "\nHTTP_STATUS:%{http_code}" "http://127.0.0.1:3016/api/operaciones/control-vivo"');
  console.log('PROD Backend 3016:\n', curl3016.stdout.slice(-150));
  ssh.dispose();
}
run().catch(console.error);
