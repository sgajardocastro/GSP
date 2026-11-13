import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function inspectHttpsLe() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  console.log("=== https_le.conf lines 160-200 ===");
  const lines = await ssh.execCommand('sed -n "160,200p" /etc/nginx/sites-enabled/https_le.conf');
  console.log(lines.stdout);

  ssh.dispose();
}

inspectHttpsLe().catch(console.error);
