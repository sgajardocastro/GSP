const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();
async function run() {
  await ssh.connect({ host: 'servidor.leanglobal.cl', port: 1295, username: 'root', password: 'lgbl2025.' });
  const pm2 = await ssh.execCommand('su - nodeadmin -c "pm2 list"');
  console.log('PM2 List:\n', pm2.stdout);
  
  const backendLogs = await ssh.execCommand('su - nodeadmin -c "pm2 logs lean-services-gsp --lines 20 --nostream"');
  console.log('Backend logs:\n', backendLogs.stdout);
  const checkNode = await ssh.execCommand('node -v');
  console.log('Root Node:', checkNode.stdout);
  const checkUserNode = await ssh.execCommand('su - nodeadmin -c "node -v"');
  console.log('Nodeadmin Node:', checkUserNode.stdout);
  const checkAxios = await ssh.execCommand('ls -d /home/nodeadmin/proyectos/lean-services-gsp/node_modules/axios');
  console.log('Remote Axios:', checkAxios.stdout || checkAxios.stderr);
}
run().catch(console.error);
