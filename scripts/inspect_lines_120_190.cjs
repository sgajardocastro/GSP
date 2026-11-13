const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectLines() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('cat /tmp/preview_ot32_puntos124.txt');
  const lines = res.stdout.split('\n');

  console.log('--- LINEAS 120 A 190 ---');
  for (let i = 120; i <= Math.min(lines.length - 1, 190); i++) {
    console.log(`L${i}: ${lines[i]}`);
  }

  ssh.dispose();
}

inspectLines().catch(console.error);
