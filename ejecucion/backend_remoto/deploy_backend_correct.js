const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const filesToUpload = [
  {
    local: 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/models/tequEquipoModel.js',
    remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/models/tequEquipoModel.js'
  },
  {
    local: 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/controllers/tequEquipoController.js',
    remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/tequEquipoController.js'
  },
  {
    local: 'd:/SGaja|rdo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/routes/tequEquipoRoutes.js',
    remote: '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/tequEquipoRoutes.js'
  }
];

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

    for (const file of filesToUpload) {
      console.log(`Uploading ${file.local} to ${file.remote}...`);
      await ssh.putFile(file.local, file.remote);
    }
    console.log("All backend files uploaded successfully!");

    console.log("Fixing remote file ownership to nodeadmin...");
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/');

    console.log("Restarting PM2 process lean-services-gsp as nodeadmin...");
    const restartResult = await ssh.execCommand('sudo -u nodeadmin pm2 restart lean-services-gsp');
    console.log("PM2 restart output:", restartResult.stdout || restartResult.stderr);

    console.log("🎉 Backend successfully updated and restarted!");
  } catch (err) {
    console.error("Deployment failed:", err);
  } finally {
    ssh.dispose();
  }
}

run();
