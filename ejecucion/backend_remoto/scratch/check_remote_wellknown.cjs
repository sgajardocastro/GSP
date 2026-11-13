const { NodeSSH } = require('node-ssh');

async function run() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log("=== Raíces de Nginx en nginx.conf ===");
  const r1 = await ssh.execCommand("grep -n -C 5 'root ' /etc/nginx/nginx.conf");
  console.log(r1.stdout);

  console.log("=== Server block de 443 en nginx.conf o conf.d ===");
  const r2 = await ssh.execCommand("grep -n -C 5 'ssl' /etc/nginx/nginx.conf /etc/nginx/conf.d/*.conf");
  console.log(r2.stdout);

  ssh.dispose();
}

run().catch(console.error);
