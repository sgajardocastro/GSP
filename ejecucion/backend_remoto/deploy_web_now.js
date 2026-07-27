const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const localDist = 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/frontend/dist';
const remoteDir = '/var/www/html/lg-gsp-dev';

async function run() {
  try {
    console.log("Connecting via SSH...");
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });
    console.log("Connected!");

    console.log(`Uploading ${localDist} to ${remoteDir}...`);
    const status = await ssh.putDirectory(localDist, remoteDir, {
      recursive: true,
      concurrency: 10,
      validate: function(itemPath) {
        return path.basename(itemPath) !== '.DS_Store';
      }
    });

    if (status) {
      console.log("Frontend uploaded successfully!");
    } else {
      console.log("Some files failed to upload.");
    }

    console.log("Setting directory permissions...");
    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} || chown -R root:root ${remoteDir}`);

    console.log("🎉 Frontend successfully updated!");
  } catch (err) {
    console.error("Deployment failed:", err);
  } finally {
    ssh.dispose();
  }
}

run();
