const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();

async function uploadMarchaBlanca() {
  try {
    const baseDir = path.resolve(__dirname, '../../antecedentes_reuniones/presentaciones');
    const htmlPath = path.join(baseDir, 'Marcha_Blanca_Casos_de_Negocio_GSP.html');
    const imgPath = path.join(baseDir, 'compromiso_banner.png');

    console.log('Leyendo archivos fuente...');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Inlining base64 to ensure 100% autonomy
    if (fs.existsSync(imgPath)) {
      const imgBase64 = fs.readFileSync(imgPath).toString('base64');
      const dataUri = `data:image/png;base64,${imgBase64}`;
      htmlContent = htmlContent.replace('src="compromiso_banner.png"', `src="${dataUri}"`);
      console.log('Imagen convertida a base64 inline.');
    }

    const tempUploadFile = path.join(__dirname, 'marcha_blanca_upload.html');
    fs.writeFileSync(tempUploadFile, htmlContent, 'utf8');

    console.log('Conectando por SSH a servidor.leanglobal.cl:1295...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 10000
    });
    console.log('Conectado con éxito.');

    // Ensure remote directory exists
    const remoteDir = '/var/www/html/pptas/GSP/reuniones';
    await ssh.execCommand(`mkdir -p ${remoteDir}`);
    console.log(`Directorio remoto verificado: ${remoteDir}`);

    // Upload file
    const remoteFile = `${remoteDir}/marcha_blanca.html`;
    await ssh.putFile(tempUploadFile, remoteFile);
    console.log(`Archivo subido exitosamente a: ${remoteFile}`);

    // Upload image file as well just in case
    if (fs.existsSync(imgPath)) {
      await ssh.putFile(imgPath, `${remoteDir}/compromiso_banner.png`);
      console.log(`Imagen de respaldo subida a: ${remoteDir}/compromiso_banner.png`);
    }

    // Set permissions
    await ssh.execCommand(`chmod 644 ${remoteDir}/marcha_blanca.html ${remoteDir}/compromiso_banner.png`);
    console.log('Permisos 644 aplicados.');

    // Cleanup temp local file
    if (fs.existsSync(tempUploadFile)) {
      fs.unlinkSync(tempUploadFile);
    }

    console.log('=== Despliegue completado con éxito ===');
  } catch (err) {
    console.error('Error durante la subida:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

uploadMarchaBlanca();
