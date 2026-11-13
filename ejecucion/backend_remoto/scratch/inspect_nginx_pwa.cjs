const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- NGINX SITES /var/www/html ---');
  const ls = await ssh.execCommand('ls -la /var/www/html');
  console.log(ls.stdout);

  console.log('--- NGINX CONFIG GSP ---');
  const conf = await ssh.execCommand('cat /etc/nginx/conf.d/servidor.leanglobal.cl.conf || cat /etc/nginx/sites-enabled/*');
  console.log(conf.stdout);

  ssh.dispose();
}

run();
