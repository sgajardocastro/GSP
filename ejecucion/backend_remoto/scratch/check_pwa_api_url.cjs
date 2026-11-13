const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  const grepBaseUrl = await ssh.execCommand('grep -o "baseURL:[^,]*" /var/www/html/pwa-gsp-prod/js/app.*.js || grep -o "baseURL:[^,]*" /var/www/html/pwa-gsp-dev/js/app.*.js');
  console.log('BASE URL MATCHES:\n', grepBaseUrl.stdout);

  const grepLgGsp = await ssh.execCommand('grep -o "lg-gsp[^\"\' ]*" /var/www/html/pwa-gsp-prod/js/app.*.js | head -n 30');
  console.log('LG GSP MATCHES IN PROD JS:\n', grepLgGsp.stdout);

  ssh.dispose();
}

run();
