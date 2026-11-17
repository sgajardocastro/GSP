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

  const r1 = await ssh.execCommand('grep -i -E "assets|base" /var/www/html/lg-gsp-dev/index.html');
  console.log('DEV INDEX:', r1.stdout);

  const r2 = await ssh.execCommand('cat /etc/nginx/conf.d/*.conf /etc/nginx/nginx.conf 2>/dev/null | grep -A 10 "lg-gsp-prod"');
  console.log('NGINX:', r2.stdout);

  ssh.dispose();
}

run().catch(console.error);
