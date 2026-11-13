const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  console.log('=== SYSTEMCTL SERVICES ===');
  const services = await ssh.execCommand('systemctl list-units --type=service --state=running | grep -E "gsp|node|api"');
  console.log(services.stdout);

  console.log('=== NGINX CONFIG PROXY_PASS ===');
  const nginx = await ssh.execCommand('grep -rn "proxy_pass" /etc/nginx/');
  console.log(nginx.stdout);

  console.log('=== PROCESSES LISTENING ON PORTS ===');
  const netstat = await ssh.execCommand('ss -tulpn | grep -E "300|301|302|303|304|305|306|307|308|309|500"');
  console.log(netstat.stdout);

  ssh.dispose();
}

check().catch(console.error);
