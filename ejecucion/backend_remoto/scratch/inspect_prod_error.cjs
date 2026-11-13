const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectLogs() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== ERROR LOG DE LEAN-SERVICES-GSP-PROD ===');
  const resLogs = await ssh.execCommand('tail -n 30 /home/nodeadmin/.pm2/logs/lean-services-gsp-prod-error.log');
  console.log(resLogs.stdout || resLogs.stderr);

  console.log('=== GREP ID_FILE EN GSP-PROD ===');
  const resGrep = await ssh.execCommand('grep -n "id_file" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/enrolamientoService.js');
  console.log(resGrep.stdout || resGrep.stderr);

  ssh.dispose();
}

inspectLogs().catch(console.error);
