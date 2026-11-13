const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkNotifLogs() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== OUT LOG RECIENTE ===');
  const resOut = await ssh.execCommand('tail -n 40 /home/nodeadmin/.pm2/logs/lean-services-gsp-prod-out.log');
  console.log(resOut.stdout);

  console.log('=== ERROR LOG RECIENTE ===');
  const resErr = await ssh.execCommand('tail -n 40 /home/nodeadmin/.pm2/logs/lean-services-gsp-prod-error.log');
  console.log(resErr.stdout);

  ssh.dispose();
}

checkNotifLogs().catch(console.error);
