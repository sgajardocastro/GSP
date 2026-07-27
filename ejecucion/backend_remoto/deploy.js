const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Connecting to server...');
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });
    console.log('Connected!');

    const localSrcDir = path.join(__dirname, 'src');
    const remoteDestDir = '/home/nodeadmin/proyectos/lean-services-gsp/src';

    console.log(`Uploading ${localSrcDir} to ${remoteDestDir}...`);
    
    // uploadDirectory uploads all files recursively
    const failed = [];
    const successful = [];
    await ssh.putDirectory(localSrcDir, remoteDestDir, {
      recursive: true,
      concurrency: 10,
      tick: function(localPath, remotePath, error) {
        if (error) {
          failed.push(localPath);
          console.error(`Failed to upload ${localPath}:`, error);
        } else {
          successful.push(localPath);
        }
      }
    });

    console.log(`Upload complete. ${successful.length} successful, ${failed.length} failed.`);

    console.log('Fixing permissions...');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');

    console.log('Restarting PM2 process as nodeadmin...');
    const result = await ssh.execCommand('su - nodeadmin -c "pm2 restart lean-services-gsp"');
    console.log('PM2 restart output:');
    console.log(result.stdout);
    if (result.stderr) {
      console.error('PM2 restart error:');
      console.error(result.stderr);
    }

    console.log('Deployment completely successful!');
  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    ssh.dispose();
  }
}

deploy();
