const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('grep -rn "no puede ser menor al último horómetro registrado" /var/www/html/pwa-gsp-prod/js/');
  console.log('grep report diario horometro in pwa-gsp-prod/js:\n', res.stdout);

  ssh.dispose();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
