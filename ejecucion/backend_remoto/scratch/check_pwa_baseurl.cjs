const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  const idx = await ssh.execCommand('cat /var/www/html/pwa-gsp-prod/index.html');
  console.log('INDEX HTML PROD:\n', idx.stdout);

  const grepBaseUrl = await ssh.execCommand('grep -rn "baseURL" /var/www/html/pwa-gsp-prod/js/ || grep -rn "http" /var/www/html/pwa-gsp-prod/js/app.*.js');
  console.log('GREP JS:\n', grepBaseUrl.stdout.substring(0, 1000));

  ssh.dispose();
}

run();
