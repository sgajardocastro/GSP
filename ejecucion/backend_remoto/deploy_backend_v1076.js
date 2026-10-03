const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

const basePath = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto';
const remoteBase = '/home/nodeadmin/proyectos/lean-services-gsp';

const filesToUpload = [
  {
    local: path.join(basePath, 'src/services/edpPdfService.js'),
    remote: `${remoteBase}/src/services/edpPdfService.js`
  },
  {
    local: path.join(basePath, 'src/services/reportDiarioPdfService.js'),
    remote: `${remoteBase}/src/services/reportDiarioPdfService.js`
  },
  {
    local: path.join(basePath, 'src/controllers/estadoPagoController.js'),
    remote: `${remoteBase}/src/controllers/estadoPagoController.js`
  },
  {
    local: path.join(basePath, 'src/controllers/reportDiarioController.js'),
    remote: `${remoteBase}/src/controllers/reportDiarioController.js`
  },
  {
    local: path.join(basePath, 'src/models/messageModel.js'),
    remote: `${remoteBase}/src/models/messageModel.js`
  },
  {
    local: path.join(basePath, 'src/database/20261003_alter_tedp_reporte_avance_colacion_horarios.sql'),
    remote: `${remoteBase}/src/database/20261003_alter_tedp_reporte_avance_colacion_horarios.sql`
  }
];

async function run() {
  try {
    console.log("Connecting to remote server...");
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });
    console.log("Connected to server.leanglobal.cl:1295!");

    for (const file of filesToUpload) {
      console.log(`Uploading ${path.basename(file.local)} -> ${file.remote}...`);
      await ssh.putFile(file.local, file.remote);
    }
    console.log("All backend files uploaded successfully!");

    console.log("Fixing remote file ownership to nodeadmin...");
    await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${remoteBase}/src/`);

    console.log("Restarting PM2 process lean-services-gsp as nodeadmin...");
    const restartResult = await ssh.execCommand('sudo -u nodeadmin pm2 restart lean-services-gsp');
    console.log("PM2 restart output:", restartResult.stdout || restartResult.stderr);

    console.log("Verifying PM2 status...");
    const statusResult = await ssh.execCommand('sudo -u nodeadmin pm2 status lean-services-gsp');
    console.log("PM2 status:", statusResult.stdout);

    console.log("Backend successfully deployed and active!");
  } catch (err) {
    console.error("Deployment failed:", err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

run();
