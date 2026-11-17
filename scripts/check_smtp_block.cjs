const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkFirewallAndRoutes() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('--- 1. PING Y HTTP A 138.255.101.224 ---');
  const ping = await ssh.execCommand('ping -c 2 138.255.101.224');
  console.log(ping.stdout || ping.stderr);

  console.log('--- 2. PROBAR PUERTO 80/443/2083 EN powercp2 ---');
  const curlWeb = await ssh.execCommand('curl -sI -m 5 https://powercp2.zglobalhost.com:2083/ | head -n 3');
  console.log('Port 2083 (cPanel):', curlWeb.stdout || curlWeb.stderr || 'No response / timeout');

  const curl443 = await ssh.execCommand('curl -sI -m 5 https://powercp2.zglobalhost.com/ | head -n 3');
  console.log('Port 443 (HTTPS):', curl443.stdout || curl443.stderr || 'No response / timeout');

  console.log('--- 3. PROBAR OTRO SERVIDOR SMTP (ej: smtp.gmail.com:587) ---');
  const testGmail = await ssh.execCommand('python3 -c "import socket; s = socket.socket(); s.settimeout(5); print(\'Gmail 587:\', s.connect_ex((\'smtp.gmail.com\', 587))); s.close()"');
  console.log(testGmail.stdout);

  console.log('--- 4. IPTABLES SALIDA ---');
  const iptables = await ssh.execCommand('iptables -L OUTPUT -n -v | head -n 15');
  console.log(iptables.stdout);

  ssh.dispose();
}

checkFirewallAndRoutes().catch(console.error);
