const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

ssh.connect({
  host: '138.255.103.18',
  username: 'root',
  password: 'lgbl2025.',
  port: 1295
}).then(async () => {
  const r = await ssh.execCommand('su - nodeadmin -c "pm2 logs lean-services-gsp-prod --lines 30 --nostream"');
  console.log(r.stdout || r.stderr);
  ssh.dispose();
}).catch(console.error);
