const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log("Connecting to server...");
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });
    console.log("Connected!");

    const localModel = 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/models/proyectoModel.js';
    const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';

    console.log(`Uploading ${localModel} to ${remoteModel}...`);
    await ssh.putFile(localModel, remoteModel);
    console.log("proyectoModel.js uploaded successfully!");

    console.log("Fixing ownership...");
    await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js');

    console.log("Restarting PM2 process lean-services-gsp...");
    const res = await ssh.execCommand('sudo -u nodeadmin pm2 restart lean-services-gsp');
    console.log("PM2 restart result:", res.stdout || res.stderr);

    console.log("🎉 Model deployed!");
  } catch (err) {
    console.error("Deployment failed:", err);
  } finally {
    ssh.dispose();
  }
}

run();
