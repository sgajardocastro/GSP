const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployItsBackendDev() {
  console.log('=== DESPLEGANDO BACKEND DEV (ITS compilar-pdf) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const localRoutes = path.resolve(__dirname, '../ejecucion/backend_remoto/src/routes/itsRoutes.js');

  const remoteController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js';
  const remoteRoutes = '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/itsRoutes.js';

  console.log('1. Subiendo itsController.js a DEV...');
  await ssh.putFile(localController, remoteController);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteController}`);

  console.log('2. Subiendo itsRoutes.js a DEV...');
  await ssh.putFile(localRoutes, remoteRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteRoutes}`);

  console.log('3. Reiniciando PM2 DEV (10)...');
  const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(restartRes.stdout || restartRes.stderr);

  await new Promise(r => setTimeout(r, 2000));

  console.log('4. Verificando estado del proceso 10...');
  const statusRes = await ssh.execCommand('su - nodeadmin -c "pm2 status 10"');
  console.log(statusRes.stdout);

  ssh.dispose();
  console.log('\n=== DESPLIEGUE BACKEND DEV COMPLETADO CON ÉXITO ===');
}

deployItsBackendDev().catch(err => {
  console.error('Error desplegando backend DEV:', err);
  process.exit(1);
});
