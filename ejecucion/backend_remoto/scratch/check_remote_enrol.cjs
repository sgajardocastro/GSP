const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkRemote() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== DEV /home/ubuntu/leangsp ===');
  const resDev = await ssh.execCommand('grep -n "id_file" /home/ubuntu/leangsp/src/services/enrolamientoService.js');
  console.log(resDev.stdout || resDev.stderr);

  console.log('=== PROD /home/ubuntu/leangsp-prod ===');
  const resProd = await ssh.execCommand('grep -n "id_file" /home/ubuntu/leangsp-prod/src/services/enrolamientoService.js');
  console.log(resProd.stdout || resProd.stderr);

  ssh.dispose();
}

checkRemote().catch(console.error);
