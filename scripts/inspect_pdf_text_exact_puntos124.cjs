const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('cat /tmp/preview_ot32_puntos124.txt');
  const lines = res.stdout.split('\n');

  console.log('--- BUSCANDO MATIAS BARRALES EN PDF ---');
  lines.forEach((l, idx) => {
    if (l.toUpperCase().includes('BARRALES')) {
      console.log(`[${idx}] ${l}`);
      for (let i = Math.max(0, idx - 5); i <= Math.min(lines.length - 1, idx + 8); i++) {
        console.log(`  L${i}: ${lines[i]}`);
      }
    }
  });

  console.log('\n--- BUSCANDO MOVILIZACION EN PDF ---');
  lines.forEach((l, idx) => {
    if (l.toUpperCase().includes('MOVILIZACI')) {
      console.log(`[${idx}] ${l}`);
      for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 8); i++) {
        console.log(`  L${i}: ${lines[i]}`);
      }
    }
  });

  console.log('\n--- BUSCANDO ALIMENTACION EN PDF ---');
  lines.forEach((l, idx) => {
    if (l.toUpperCase().includes('ALIMENTACI')) {
      console.log(`[${idx}] ${l}`);
      for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 8); i++) {
        console.log(`  L${i}: ${lines[i]}`);
      }
    }
  });

  ssh.dispose();
}

inspect().catch(console.error);
