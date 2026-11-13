const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep -A 10 "GSP-2611-00003" /tmp/test_ot32.txt');
  console.log('--- Fila de Jornada OT 32 ---');
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
