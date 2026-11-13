import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkNginxServices() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  console.log("=== CHECK lean-services in NGINX ===");
  const grepRes = await ssh.execCommand('grep -rn "lean-services" /etc/nginx/');
  console.log(grepRes.stdout);

  ssh.dispose();
}

checkNginxServices().catch(console.error);
