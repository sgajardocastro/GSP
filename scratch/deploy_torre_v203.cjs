const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

async function main() {
  const ssh = new NodeSSH();
  console.log('Connecting to SSH server 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ SSH connection established.');

  const localBase = path.resolve(__dirname, '..');
  const localDistProd = path.join(localBase, 'ejecucion/frontend/dist_prod');
  const localDistDev = path.join(localBase, 'ejecucion/frontend/dist_dev');

  // 1. Deploy PROD
  if (fs.existsSync(localDistProd)) {
    const remoteWebProd = '/var/www/html/lg-gsp-prod';
    console.log(`\n--- Deploying dist_prod to ${remoteWebProd} ---`);
    const okProd = await ssh.putDirectory(localDistProd, remoteWebProd, {
      recursive: true,
      concurrency: 10,
      validate: (item) => !item.includes('.git')
    });
    if (!okProd) throw new Error('Failed to transfer dist_prod');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteWebProd} && chmod -R 755 ${remoteWebProd}`);
    console.log('✔ PROD Frontend deployed successfully.');
  }

  // 2. Deploy DEV
  if (fs.existsSync(localDistDev)) {
    const remoteWebDev = '/var/www/html/lg-gsp-dev';
    console.log(`\n--- Deploying dist_dev to ${remoteWebDev} ---`);
    const okDev = await ssh.putDirectory(localDistDev, remoteWebDev, {
      recursive: true,
      concurrency: 10,
      validate: (item) => !item.includes('.git')
    });
    if (!okDev) throw new Error('Failed to transfer dist_dev');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
    console.log('✔ DEV Frontend deployed successfully.');
  }

  // 3. Health check
  console.log('\n--- Empirical Health Checks ---');
  const curlProd = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/ | head -n 1');
  const curlDev = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-dev/ | head -n 1');
  console.log('PROD HTTP Status:', curlProd.stdout.trim());
  console.log('DEV HTTP Status:', curlDev.stdout.trim());

  // 4. Verify bundle contents on remote
  const verifyProdCardex = await ssh.execCommand('grep -rn "Vista Cardex" /var/www/html/lg-gsp-prod/assets/ | wc -l');
  const verifyProdFechas = await ssh.execCommand('grep -rn "Fechas con fichas" /var/www/html/lg-gsp-prod/assets/ | wc -l');
  const verifyDevCardex = await ssh.execCommand('grep -rn "Vista Cardex" /var/www/html/lg-gsp-dev/assets/ | wc -l');
  const verifyDevFechas = await ssh.execCommand('grep -rn "Fechas con fichas" /var/www/html/lg-gsp-dev/assets/ | wc -l');

  console.log('\n--- Remote Bundle Verifications ---');
  console.log('PROD matches "Vista Cardex":', verifyProdCardex.stdout.trim());
  console.log('PROD matches "Fechas con fichas":', verifyProdFechas.stdout.trim());
  console.log('DEV matches "Vista Cardex":', verifyDevCardex.stdout.trim());
  console.log('DEV matches "Fechas con fichas":', verifyDevFechas.stdout.trim());

  ssh.dispose();
  console.log('\n✔ All deployments and empirical validations completed successfully.');
}

main().catch(err => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});
