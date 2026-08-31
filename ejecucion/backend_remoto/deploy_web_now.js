const { NodeSSH } = require('d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const localDist = 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/frontend/dist';
const remoteDir = '/var/www/html/lg-gsp-dev';

async function run() {
  console.log("🚀 Iniciando despliegue de Frontend Web a servidor remoto...");
  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log("✅ Conectado por SSH como root!");

    console.log(`Subiendo ${localDist} a ${remoteDir}...`);
    const status = await ssh.putDirectory(localDist, remoteDir, {
      recursive: true,
      concurrency: 10,
      validate: function(itemPath) {
        return path.basename(itemPath) !== '.DS_Store';
      }
    });

    if (status) {
      console.log("✅ Frontend subido exitosamente a /var/www/html/lg-gsp-dev!");
    } else {
      console.log("⚠️ Algunos archivos no se pudieron subir.");
    }

    console.log("Ajustando permisos...");
    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} || chown -R root:root ${remoteDir}`);
    await ssh.execCommand(`chmod -R 755 ${remoteDir}`);

    console.log("🎉 Frontend Web desplegado exitosamente en servidor remoto!");
  } catch (err) {
    console.error("❌ Error en despliegue Frontend:", err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

run();
