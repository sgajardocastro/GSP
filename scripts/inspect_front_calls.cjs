const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectFrontendModalVisor() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `grep -n -C 10 "regularizarReporteManual" /var/www/html/lg-gsp-prod/assets/*.js || grep -n -C 10 "adjuntar-respaldo" /var/www/html/lg-gsp-prod/assets/*.js`;
  const res = await ssh.execCommand(cmd);
  console.log('FRONTEND CALLS:\n', res.stdout.slice(0, 1500));

  ssh.dispose();
}

inspectFrontendModalVisor().catch(console.error);
