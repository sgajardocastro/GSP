const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');

async function runRemote() {
  console.log('=== CONECTANDO A SERVIDOR REMOTO DEV PARA EJECUTAR CICLO INTEGRAL ===');
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const remoteFile = '/home/nodeadmin/proyectos/lean-services-gsp/run_e2e_leanglobal.cjs';
  const localFile = path.resolve(__dirname, 'run_e2e_full_leanglobal_cycle.cjs');

  console.log(`Subiendo suite integral a ${remoteFile}...`);
  await ssh.putFile(localFile, remoteFile);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteFile}`);

  console.log('--- EJECUTANDO TEST INTEGRAL COMPLETO (WEB + PWA) EN DEV ---');
  const res = await ssh.execCommand(`su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node run_e2e_leanglobal.cjs"`);
  console.log('STDOUT:\n', res.stdout);
  if (res.stderr) {
    console.log('STDERR:\n', res.stderr);
  }

  // Limpiar script temporal
  await ssh.execCommand(`rm -f ${remoteFile}`);

  ssh.dispose();
  console.log('\nEjecución finalizada.');
}

runRemote().catch(console.error);
