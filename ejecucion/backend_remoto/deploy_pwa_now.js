const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const localDist = 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/pwa/dist';
const remoteDir = '/var/www/html/pwa-gsp-dev';

async function run() {
  try {
    console.log("Connecting via SSH for PWA deployment...");
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
      console.log("PWA uploaded successfully!");
    } else {
      console.log("Some files failed to upload.");
    }

    console.log("Setting directory permissions...");
    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} || chown -R root:root ${remoteDir}`);

    console.log("🎉 PWA successfully updated on servidor.leanglobal.cl/pwa-gsp-dev!");
  } catch (err) {
    console.error("PWA Deployment failed:", err);
  } finally {
    ssh.dispose();
  }
}

run();
