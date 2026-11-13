const path = require('path');
const fs = require('fs');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  console.log('Connecting to remote server via SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const controllers = [
    'controlVivoController.js',
    'reportDiarioController.js',
    'itsController.js',
    'estadoPagoController.js',
    'backlogController.js'
  ];

  const localBase = path.resolve('ejecucion/backend_remoto/src/controllers');
  const remoteDevBase = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers';
  const remoteProdBase = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers';

  console.log('--- 1. Subiendo controladores Backend a DEV y PROD ---');
  for (const c of controllers) {
    const localFile = path.join(localBase, c);
    console.log(`Subiendo ${c}...`);
    await ssh.putFile(localFile, `${remoteDevBase}/${c}`);
    await ssh.putFile(localFile, `${remoteProdBase}/${c}`);
  }

  console.log('--- 2. Reiniciando servicios PM2 ---');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 reload 10 && pm2 reload 13"');
  console.log(pm2Res.stdout);
  if (pm2Res.stderr) console.error(pm2Res.stderr);

  console.log('--- 3. Subiendo Frontend compilado (PROD y DEV) ---');
  const distProdLocal = path.resolve('ejecucion/frontend/dist_prod');
  const distDevLocal = path.resolve('ejecucion/frontend/dist_dev');

  if (fs.existsSync(distProdLocal)) {
    console.log('Sincronizando dist_prod a /var/www/html/lg-gsp-prod/ ...');
    await ssh.putDirectory(distProdLocal, '/var/www/html/lg-gsp-prod', {
      recursive: true,
      concurrency: 5
    });
  }

  if (fs.existsSync(distDevLocal)) {
    console.log('Sincronizando dist_dev a /var/www/html/lg-gsp-dev/ ...');
    await ssh.putDirectory(distDevLocal, '/var/www/html/lg-gsp-dev', {
      recursive: true,
      concurrency: 5
    });
  }

  console.log('--- 4. Verificación de salud HTTP ---');
  const curlProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  const curlDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`HTTP PROD: ${curlProd.stdout}`);
  console.log(`HTTP DEV: ${curlDev.stdout}`);

  ssh.dispose();
  console.log('DEPLOY COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('DEPLOY ERROR:', err);
  process.exit(1);
});
