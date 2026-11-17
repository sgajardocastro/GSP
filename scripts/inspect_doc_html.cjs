const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectDocHtml() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep -n -C 5 "Alfonso" /var/www/html/lg-gsp-prod/centro_documentacion_gsp.html');
  console.log(res.stdout);

  ssh.dispose();
}

inspectDocHtml().catch(console.error);
