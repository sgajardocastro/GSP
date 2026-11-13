const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectPorts() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const netstat = await ssh.execCommand('ss -tulpn | grep node');
  console.log('Node processes ports:\n', netstat.stdout);
  
  const nginxDev = await ssh.execCommand('grep -rn "proxy_pass" /etc/nginx/conf.d/ /etc/nginx/sites-enabled/ 2>/dev/null | grep gsp');
  console.log('Nginx GSP proxies:\n', nginxDev.stdout);

  ssh.dispose();
}

inspectPorts().catch(console.error);
