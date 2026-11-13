const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

ssh.connect({
  host: '138.255.103.18',
  username: 'root',
  password: 'lgbl2025.',
  port: 1295
}).then(async () => {
  const r = await ssh.execCommand(`
    curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/its/preview-pdf/30 > /tmp/ot30_audit.pdf
    pdftotext /tmp/ot30_audit.pdf /tmp/ot30_audit.txt
    cat /tmp/ot30_audit.txt
  `);
  console.log(r.stdout);
  ssh.dispose();
}).catch(console.error);
