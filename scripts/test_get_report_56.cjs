const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/operaciones/report/proyecto/56');
  console.log('HTTP 3016 /operaciones/report/proyecto/56 length:', res.stdout.length);
  console.log('Response sample:', res.stdout.substring(0, 1000));
  ssh.dispose();
}

main().catch(console.error);
