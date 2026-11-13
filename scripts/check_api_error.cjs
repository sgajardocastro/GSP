const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/operaciones/its/32');
  console.log('Respuesta curl ITS 32 (length ' + res.stdout.length + '):');
  console.log(res.stdout.slice(0, 1000));

  const pm2Log = await ssh.execCommand('su - nodeadmin -c "pm2 logs 13 --lines 30 --nostream"');
  console.log('\nPM2 13 logs:');
  console.log(pm2Log.stdout);

  ssh.dispose();
}

main().catch(console.error);
