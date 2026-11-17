const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkRecentFiles() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('find /home/nodeadmin/proyectos/lean-services-gsp-prod -mtime -2 -type f | grep -v node_modules | grep -v logs');
  console.log('Archivos modificados en las últimas 48h en prod backend:\n', res.stdout);
  ssh.dispose();
}
checkRecentFiles().catch(console.error);
