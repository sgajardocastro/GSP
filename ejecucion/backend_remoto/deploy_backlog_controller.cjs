const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deploy() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 10000
    });
    console.log('Conectado a servidor.leanglobal.cl como root...');

    const localFile = path.join(__dirname, 'src/controllers/backlogController.js');
    const remoteFile = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/backlogController.js';

    await ssh.putFile(localFile, remoteFile);
    console.log('backlogController.js subido con éxito.');

    const res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('PM2 restart:', res.stdout);

    ssh.dispose();
  } catch (err) {
    console.error('Error deployando backend:', err);
    process.exit(1);
  }
}

deploy();
