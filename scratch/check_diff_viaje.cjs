const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const diffViaje = await ssh.execCommand('git diff src/models/viajeModel.js', {
    cwd: '/home/nodeadmin/proyectos/lean-services-gsp-prod'
  });
  console.log('DIFF viajeModel.js:\n', diffViaje.stdout);

  ssh.dispose();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
