const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const resFiles = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/gsp-whatsapp-service');
  console.log(resFiles.stdout);

  const resHead = await ssh.execCommand('head -n 50 /home/nodeadmin/proyectos/gsp-whatsapp-service/server.js');
  console.log(resHead.stdout);

  const resLogs = await ssh.execCommand('tail -n 30 /home/nodeadmin/.pm2/logs/gsp-whatsapp-out.log');
  console.log('LOGS OUT:');
  console.log(resLogs.stdout);

  const resErr = await ssh.execCommand('tail -n 30 /home/nodeadmin/.pm2/logs/gsp-whatsapp-error.log');
  console.log('LOGS ERR:');
  console.log(resErr.stdout);

  ssh.dispose();
}

run().catch(console.error);
