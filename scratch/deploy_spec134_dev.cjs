const path = require('path');
const fs = require('fs');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function deployAndVerify() {
  console.log('Connecting SSH to 138.255.103.18...');
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  console.log('SSH connected OK.');

  // 1. Upload backend files
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';
  console.log('Uploading proyectoModel.js...');
  await ssh.putFile(localModel, remoteModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteModel}`);

  const localCtrl = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/asignacionRecursosController.js');
  const remoteCtrl = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/asignacionRecursosController.js';
  console.log('Uploading asignacionRecursosController.js...');
  await ssh.putFile(localCtrl, remoteCtrl);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteCtrl}`);
  console.log('Backend files uploaded OK.');

  // 2. Restart PM2 10
  console.log('Restarting PM2 service 10...');
  const resPm2 = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 restart:', resPm2.stdout);

  // 3. Sync frontend dist_dev
  console.log('Syncing dist_dev to /var/www/html/lg-gsp-dev/...');
  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  await ssh.putDirectory(localDist, '/var/www/html/lg-gsp-dev', {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev && chmod -R 755 /var/www/html/lg-gsp-dev');
  console.log('Frontend dist_dev synced OK.');

  // 4. Test OT generation on Project 204
  console.log('Regenerating OT on Project 204...');
  const testScript = `
require('dotenv').config();
const proyectoModel = require('./src/models/proyectoModel');

async function testOT() {
  try {
    const result = await proyectoModel.generarOTVersion(204, 55);
    console.log('OT GENERADA:', JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    console.error('Error generando OT:', err);
    process.exit(1);
  }
}
testOT();
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/test_ot_204.cjs
${testScript}
EOF`);

  const resTest = await ssh.execCommand('node /tmp/test_ot_204.cjs', {
    cwd: '/home/nodeadmin/proyectos/lean-services-gsp'
  });
  console.log('Resultado generar OT 204:\n', resTest.stdout || resTest.stderr);
  await ssh.execCommand('rm -f /tmp/test_ot_204.cjs');

  ssh.dispose();
}

deployAndVerify().catch(console.error);
