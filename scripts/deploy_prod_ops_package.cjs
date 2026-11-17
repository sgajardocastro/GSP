const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function deployProdOps() {
  console.log('Connecting to production server 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Connected via SSH successfully.');

  const pwaDistLocal = path.resolve(__dirname, '../../gsp-prod-ops/ejecucion/pwa/dist');
  const pwaDistRemote = '/var/www/html/pwa-gsp-prod';

  console.log(`1. Uploading PWA dist to ${pwaDistRemote}...`);
  await ssh.putDirectory(pwaDistLocal, pwaDistRemote, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.DS_Store')
  });
  console.log('✔ PWA dist uploaded successfully.');

  console.log('2. Uploading Backend files...');
  const backendModelLocal = path.resolve(__dirname, '../../gsp-prod-ops/ejecucion/backend_remoto/src/models/proyectoModel.js');
  const backendModelRemote = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';
  const backendControllerLocal = path.resolve(__dirname, '../../gsp-prod-ops/ejecucion/backend_remoto/src/controllers/reportDiarioController.js');
  const backendControllerRemote = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js';

  await ssh.putFile(backendModelLocal, backendModelRemote);
  await ssh.putFile(backendControllerLocal, backendControllerRemote);
  console.log('✔ Backend files uploaded successfully.');

  console.log('3. Adjusting nginx permissions...');
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/pwa-gsp-prod');

  console.log('4. Restarting PM2 process 13 (lean-services-gsp-prod)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  console.log('5. Verifying PWA remote response:');
  const curlPwa = await ssh.execCommand('curl -I http://127.0.0.1/pwa-gsp-prod/js/app.6d38b1ea.js');
  console.log(curlPwa.stdout);

  ssh.dispose();
}

deployProdOps().catch(console.error);
