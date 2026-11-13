const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function uploadPresentation() {
  try {
    console.log('Conectando a servidor.leanglobal.cl:1295 como root...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 40000,
      keepaliveInterval: 10000
    });
    console.log('Conectado exitosamente.');

    const remoteDir = '/var/www/html/pptas/GSP/GSP-core/presentaciones/proceso';
    
    // Crear directorio remoto si no existe
    console.log(`Creando/verificando directorio remoto: ${remoteDir}`);
    await ssh.execCommand(`mkdir -p "${remoteDir}"`);

    const localFile = path.resolve(__dirname, '../../../antecedentes_reuniones/presentaciones/presentacion_pipeline_interactivo.html');
    const remoteFile = `${remoteDir}/index.html`;

    console.log(`Subiendo ${localFile} -> ${remoteFile}...`);
    await ssh.putFile(localFile, remoteFile);
    console.log('Subida completada.');

    // Permisos para Nginx
    await ssh.execCommand(`chmod -R 755 "${remoteDir}"`);
    await ssh.execCommand(`chmod 644 "${remoteFile}"`);

    // Listar contenido
    const listRes = await ssh.execCommand(`ls -la "${remoteDir}"`);
    console.log('\n--- Contenido remoto en ' + remoteDir + ' ---');
    console.log(listRes.stdout);

    console.log('\n✅ URL pública disponible:');
    console.log('🔗 https://servidor.leanglobal.cl/pptas/GSP/GSP-core/presentaciones/proceso/');
    console.log('🔗 https://servidor.leanglobal.cl/pptas/GSP/GSP-core/presentaciones/proceso/index.html');

  } catch (err) {
    console.error('Error durante la subida al servidor:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

uploadPresentation();
