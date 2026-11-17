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

  const resNginx = await ssh.execCommand('sed -n "380,450p" /etc/nginx/default.d/base.conf');
  console.log('NGINX BASE.CONF:\n', resNginx.stdout);

  ssh.dispose();
}

run().catch(console.error);
