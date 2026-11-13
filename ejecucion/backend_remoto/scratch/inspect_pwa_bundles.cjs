const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- LS /var/www/html/pwa-gsp-prod ---');
  const lsProd = await ssh.execCommand('ls -la /var/www/html/pwa-gsp-prod');
  console.log(lsProd.stdout);

  console.log('--- LS /var/www/html/pwa-gsp-dev ---');
  const lsDev = await ssh.execCommand('ls -la /var/www/html/pwa-gsp-dev');
  console.log(lsDev.stdout);

  // Check what API url is in pwa-gsp-prod js bundle
  const grepProd = await ssh.execCommand('grep -rn "api" /var/www/html/pwa-gsp-prod/assets/ | head -n 10');
  console.log('GREP API PROD:', grepProd.stdout.substring(0, 500));

  ssh.dispose();
}

run();
