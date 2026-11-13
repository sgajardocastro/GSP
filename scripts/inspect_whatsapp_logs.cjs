const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectWsp() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== ESTADO Y LOGS DE GSP-WHATSAPP (PM2 17) ===');
  const resLogs = await ssh.execCommand('su - nodeadmin -c "pm2 logs gsp-whatsapp --lines 30 --nostream"');
  console.log(resLogs.stdout || resLogs.stderr);

  ssh.dispose();
}

inspectWsp().catch(console.error);
