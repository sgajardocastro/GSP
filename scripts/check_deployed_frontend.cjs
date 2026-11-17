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

  const res = await ssh.execCommand('cat /var/www/html/lg-gsp-prod/index.html');
  console.log('INDEX.HTML PROD:\n', res.stdout);

  const resVersion = await ssh.execCommand('grep -o "v1.0.[0-9]*" /var/www/html/lg-gsp-prod/assets/index-*.js | head -n 5');
  console.log('VERSION IN BUNDLE:\n', resVersion.stdout);

  ssh.dispose();
}

run().catch(console.error);
