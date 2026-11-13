const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep -A 20 "COSTO VALOR HORA OPERADOR" /tmp/test_ot32_hhmm.txt');
  console.log('--- TABLA COSTO VALOR HORA OPERADOR ---');
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
