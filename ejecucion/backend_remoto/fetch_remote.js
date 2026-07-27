const { NodeSSH } = require('node-ssh');
const fs = require('fs');

const ssh = new NodeSSH();

async function getRemoteFiles() {
  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });

    const result = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js');
    fs.writeFileSync('remote_proyectoModel.js', result.stdout);
    console.log('Saved remote_proyectoModel.js (length: ' + result.stdout.length + ')');
    
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    ssh.dispose();
  }
}

getRemoteFiles();
