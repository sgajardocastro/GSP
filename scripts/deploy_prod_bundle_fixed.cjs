const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function deployFixedBundle() {
  console.log('Connecting to production server 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Connected via SSH successfully.');

  const distProdLocal = path.resolve(__dirname, '../../gsp-hotfix-prod/ejecucion/frontend/dist_prod');
  const distProdRemote = '/var/www/html/lg-gsp-prod';

  console.log(`Uploading fixed dist_prod from ${distProdLocal} to ${distProdRemote}...`);
  await ssh.putDirectory(distProdLocal, distProdRemote, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.DS_Store')
  });
  console.log('✔ Fixed dist_prod uploaded successfully.');

  console.log('Fixing permissions...');
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-prod');

  console.log('Verifying index.html on server:');
  const catRes = await ssh.execCommand('cat /var/www/html/lg-gsp-prod/index.html');
  console.log(catRes.stdout);

  console.log('Verifying curl to assets:');
  const curlRes = await ssh.execCommand('curl -I http://127.0.0.1/lg-gsp-prod/assets/index-B91sdtdb.js');
  console.log(curlRes.stdout);

  ssh.dispose();
}

deployFixedBundle().catch(console.error);
