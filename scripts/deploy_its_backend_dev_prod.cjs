const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployItsBackend() {
  console.log('=== DESPLEGANDO BACKEND DEV Y PROD (SPEC-070 PLANILLAS INCREMENTALES) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const localRoutes = path.resolve(__dirname, '../ejecucion/backend_remoto/src/routes/itsRoutes.js');

  // 1. DESPLIEGUE A DEV
  console.log('--- 1. DEV (/home/nodeadmin/proyectos/lean-services-gsp/) ---');
  const devController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js';
  const devRoutes = '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/itsRoutes.js';

  await ssh.putFile(localController, devController);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devController}`);
  await ssh.putFile(localRoutes, devRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devRoutes}`);

  console.log('Reiniciando PM2 DEV (10)...');
  const devRestart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(devRestart.stdout || devRestart.stderr);

  // 2. DESPLIEGUE A PROD
  console.log('\n--- 2. PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/) ---');
  const prodController = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';
  const prodRoutes = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/itsRoutes.js';

  await ssh.putFile(localController, prodController);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodController}`);
  await ssh.putFile(localRoutes, prodRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodRoutes}`);

  console.log('Reiniciando PM2 PROD (13)...');
  const prodRestart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(prodRestart.stdout || prodRestart.stderr);

  await new Promise(r => setTimeout(r, 2000));

  console.log('\n--- 3. Verificando estado de ambos procesos ---');
  const statusRes = await ssh.execCommand('su - nodeadmin -c "pm2 status 10 13"');
  console.log(statusRes.stdout);

  ssh.dispose();
  console.log('\n=== DESPLIEGUE BACKEND DEV & PROD COMPLETADO CON ÉXITO ===');
}

deployItsBackend().catch(err => {
  console.error('Error desplegando backend:', err);
  process.exit(1);
});
