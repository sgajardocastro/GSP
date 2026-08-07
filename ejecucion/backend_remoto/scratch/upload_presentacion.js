const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log("Conectando al servidor CentOS (servidor.leanglobal.cl)...");
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const targetDir = '/var/www/html/pptas/GSP/GSP-core/presentaciones';
    console.log(`Asegurando directorio remoto: ${targetDir}`);
    await ssh.execCommand(`mkdir -p ${targetDir}`);

    const localFile = 'd:\\SGajardo\\Google Drive\\Antigravity\\Grúas San Pablo\\Propuesta Gestión Operación Grúas\\antecedentes_reuniones\\presentaciones\\presentacion_proceso_general_gsp.html';
    const remoteFile = `${targetDir}/presentacion_proceso_general_gsp.html`;

    console.log(`Subiendo archivo desde ${localFile} hacia ${remoteFile}...`);
    await ssh.putFile(localFile, remoteFile);

    console.log("Ajustando permisos a 644...");
    await ssh.execCommand(`chmod 644 ${remoteFile}`);

    console.log("\n✅ Subida exitosa!");
    console.log(`URL pública estimada: https://servidor.leanglobal.cl/pptas/GSP/GSP-core/presentaciones/presentacion_proceso_general_gsp.html`);

  } catch (err) {
    console.error("❌ Error en la subida:", err);
  } finally {
    ssh.dispose();
  }
}

run();
