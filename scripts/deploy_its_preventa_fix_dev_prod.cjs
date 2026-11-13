const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== DESPLEGANDO FIX ESTRUCTURAL ITS Y PREVENTA (DEV Y PROD) ===\n');

  const files = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js'),
      subpath: 'src/models/proyectoModel.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js'),
      subpath: 'src/controllers/itsController.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js'),
      subpath: 'src/services/itsPdfService.js'
    }
  ];

  // 1. DESPLIEGUE A DEV
  console.log('--- 1. DESPLIEGUE A DEV (/home/nodeadmin/proyectos/lean-services-gsp/) ---');
  for (const f of files) {
    const remoteDest = `/home/nodeadmin/proyectos/lean-services-gsp/${f.subpath}`;
    console.log(`Subiendo ${f.subpath} -> ${remoteDest}`);
    await ssh.putFile(f.local, remoteDest);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteDest}`);
  }

  console.log('Reiniciando PM2 DEV (10)...');
  const resDevRestart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(resDevRestart.stdout.split('\n').slice(0, 15).join('\n'));

  // 2. DESPLIEGUE A PROD
  console.log('\n--- 2. DESPLIEGUE A PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/) ---');
  for (const f of files) {
    const remoteDest = `/home/nodeadmin/proyectos/lean-services-gsp-prod/${f.subpath}`;
    console.log(`Subiendo ${f.subpath} -> ${remoteDest}`);
    await ssh.putFile(f.local, remoteDest);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteDest}`);
  }

  console.log('Reiniciando PM2 PROD (13)...');
  const resProdRestart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(resProdRestart.stdout.split('\n').slice(0, 15).join('\n'));

  console.log('\n=== DESPLIEGUE COMPLETADO ===');
  ssh.dispose();
}

main().catch(console.error);
