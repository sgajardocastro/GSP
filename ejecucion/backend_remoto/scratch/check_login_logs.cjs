const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkLoginLogs() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== LOGS DE LOGIN EN PROD ===');
  const res = await ssh.execCommand('grep -E "\\[LOGIN" /home/nodeadmin/.pm2/logs/lean-services-gsp-prod-out.log | tail -n 20');
  console.log(res.stdout);

  ssh.dispose();
}

checkLoginLogs().catch(console.error);
