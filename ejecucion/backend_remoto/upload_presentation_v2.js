const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function uploadPresentation() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log('Conectado exitosamente como root a servidor.leanglobal.cl');

    const remoteDir = '/var/www/html/pptas/GSP/GSP-core/presentaciones';
    
    // Crear directorio remoto si no existe
    await ssh.execCommand(`mkdir -p "${remoteDir}"`);
    console.log(`Directorio remoto verificado/creado: ${remoteDir}`);

    const localFileV2 = path.resolve(__dirname, '../../antecedentes_reuniones/presentaciones/presentacion_proceso_general_gsp_v2.html');
    const localFileV1 = path.resolve(__dirname, '../../antecedentes_reuniones/presentaciones/presentacion_proceso_general_gsp.html');

    // Subir V2
    const remoteFileV2 = `${remoteDir}/presentacion_proceso_general_gsp_v2.html`;
    await ssh.putFile(localFileV2, remoteFileV2);
    console.log(`Subido exitosamente: ${remoteFileV2}`);

    // Subir V1 por si acaso para referencia
    const remoteFileV1 = `${remoteDir}/presentacion_proceso_general_gsp.html`;
    await ssh.putFile(localFileV1, remoteFileV1);
    console.log(`Subido exitosamente: ${remoteFileV1}`);

    // También copiar como index.html para acceso directo si se accede a la carpeta
    const remoteIndex = `${remoteDir}/index.html`;
    await ssh.putFile(localFileV2, remoteIndex);
    console.log(`Subido exitosamente como index por defecto: ${remoteIndex}`);

    // Ajustar permisos de lectura para Nginx
    await ssh.execCommand(`chmod -R 755 /var/www/html/pptas/GSP`);
    await ssh.execCommand(`chmod 644 "${remoteDir}"/*.html`);

    // Listar contenido del directorio remoto
    const listRes = await ssh.execCommand(`ls -la "${remoteDir}"`);
    console.log('\n--- Contenido en Servidor Remoto ---');
    console.log(listRes.stdout);

    console.log('\n✅ URLs públicas disponibles:');
    console.log(`🔗 https://servidor.leanglobal.cl/pptas/GSP/GSP-core/presentaciones/`);
    console.log(`🔗 https://servidor.leanglobal.cl/pptas/GSP/GSP-core/presentaciones/presentacion_proceso_general_gsp_v2.html`);
    console.log(`🔗 https://servidor.leanglobal.cl/pptas/GSP/GSP-core/presentaciones/presentacion_proceso_general_gsp.html`);

  } catch (err) {
    console.error('Error durante la subida al servidor:', err);
  } finally {
    ssh.dispose();
  }
}

uploadPresentation();
