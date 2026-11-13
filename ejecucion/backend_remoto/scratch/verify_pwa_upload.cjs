const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  const idx = await ssh.execCommand('head -n 20 /var/www/html/pwa-gsp-prod/index.html');
  console.log('INDEX.HTML:\n', idx.stdout);

  const grepApi = await ssh.execCommand('grep -rn "baseURL" /var/www/html/pwa-gsp-prod/js/app.*.js');
  console.log('GREP BASEURL:\n', grepApi.stdout);

  const grepLg = await ssh.execCommand('grep -rn "lg-gsp-prod" /var/www/html/pwa-gsp-prod/js/app.*.js');
  console.log('GREP LG-GSP-PROD:\n', grepLg.stdout.substring(0, 300));

  ssh.dispose();
}

run();
