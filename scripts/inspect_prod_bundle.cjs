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

  const r1 = await ssh.execCommand('cat /var/www/html/lg-gsp-prod/index.html');
  console.log('--- INDEX.HTML ---');
  console.log(r1.stdout);

  const r2 = await ssh.execCommand('ls -la /var/www/html/lg-gsp-prod/assets/');
  console.log('--- ASSETS ---');
  console.log(r2.stdout);

  ssh.dispose();
}

run().catch(console.error);
