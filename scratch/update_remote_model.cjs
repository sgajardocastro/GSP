const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';
  console.log('Uploading updated proyectoModel.js...');
  await ssh.putFile(localModel, remoteModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteModel}`);
  console.log('proyectoModel.js uploaded OK.');

  console.log('Restarting pm2 10...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 restarted.');

  ssh.dispose();
}

run().catch(console.error);
