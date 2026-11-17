const path = require('path');
const fs = require('fs');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function deploy() {
  console.log('Connecting SSH to 138.255.103.18...');
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  console.log('SSH connected OK.');

  // 1. Upload proyectoModel.js
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';
  console.log('Uploading proyectoModel.js...');
  await ssh.putFile(localModel, remoteModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteModel}`);
  console.log('proyectoModel.js uploaded OK.');

  // 2. Restart PM2 service 10
  console.log('Restarting pm2 service 10...');
  const resPm2 = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 restart:', resPm2.stdout || resPm2.stderr);

  // 3. Upload dist_dev to /var/www/html/lg-gsp-dev/
  console.log('Syncing dist_dev to /var/www/html/lg-gsp-dev/...');
  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  await ssh.putDirectory(localDist, '/var/www/html/lg-gsp-dev', {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev && chmod -R 755 /var/www/html/lg-gsp-dev');
  console.log('dist_dev synced OK.');

  // 4. Test generarOTVersion(96) directly on backend
  console.log('Testing generarOTVersion(96) for service 00049...');
  const testScript = `
require('dotenv').config();
const proyectoModel = require('./src/models/proyectoModel');

async function testOT() {
  try {
    console.log('Llamando generarOTVersion(96)...');
    const result = await proyectoModel.generarOTVersion(96, 55);
    console.log('OT GENERADA EXITOSAMENTE:');
    console.log('ID Documento:', result.id_documento);
    console.log('URL Descarga:', result.url_descarga);
    console.log('Filename:', result.filename);
  } catch (err) {
    console.error('ERROR EN GENERACION OT:', err);
  } finally {
    process.exit(0);
  }
}
testOT();
`;
  await ssh.execCommand("cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/test_ot_exec.js\n" + testScript + "\nEOF");
  await ssh.execCommand("chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/test_ot_exec.js");
  const resOT = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node test_ot_exec.js"');
  console.log('TEST OT OUTPUT:\n', resOT.stdout);
  console.log('TEST OT ERRORS:\n', resOT.stderr);
  await ssh.execCommand("rm -f /home/nodeadmin/proyectos/lean-services-gsp/test_ot_exec.js");

  ssh.dispose();
  console.log('Deployment and test completed.');
}

deploy().catch(console.error);
