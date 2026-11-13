const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function verify() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // Check the latest index bundle in PROD and DEV
  const lsProd = await ssh.execCommand('ls -lt /var/www/html/lg-gsp-prod/assets/index*.js | head -n 1');
  const lsDev = await ssh.execCommand('ls -lt /var/www/html/lg-gsp-dev/assets/index*.js | head -n 1');
  console.log('PROD latest index asset:', lsProd.stdout.trim());
  console.log('DEV latest index asset:', lsDev.stdout.trim());

  // Check that the bundle has the new asset hash from Vite build:
  // In build output: dist_prod/assets/index-DXkpNU_-.js and dist_dev/assets/index-B1Cx1jgO.js
  const checkProdFile = await ssh.execCommand('test -f /var/www/html/lg-gsp-prod/assets/index-DXkpNU_-.js && echo "EXISTS" || echo "MISSING"');
  const checkDevFile = await ssh.execCommand('test -f /var/www/html/lg-gsp-dev/assets/index-B1Cx1jgO.js && echo "EXISTS" || echo "MISSING"');
  console.log('PROD index-DXkpNU_-.js:', checkProdFile.stdout.trim());
  console.log('DEV index-B1Cx1jgO.js:', checkDevFile.stdout.trim());

  // Health checks
  const curlProd = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/ | head -n 1');
  const curlDev = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-dev/ | head -n 1');
  console.log('PROD HTTP Status:', curlProd.stdout.trim());
  console.log('DEV HTTP Status:', curlDev.stdout.trim());

  ssh.dispose();
}

verify().catch(console.error);
