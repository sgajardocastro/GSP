const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep -A 25 "PERSONAL Y CARGO ASIGNADO" /tmp/test_ot32_fleet.txt');
  console.log('--- DETALLE SECCIÓN 1 ---');
  console.log(res.stdout);

  const resJor = await ssh.execCommand('grep -A 25 "TIPO SERV." /tmp/test_ot32_fleet.txt');
  console.log('--- DETALLE SECCIÓN 2 ---');
  console.log(resJor.stdout);

  ssh.dispose();
}

main().catch(console.error);
