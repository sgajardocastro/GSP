const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../node_modules/node-ssh'));
const ssh = new NodeSSH();

async function uploadManual() {
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

    const localFile = path.resolve(__dirname, '../../frontend/public/manual_operador_terreno_gsp.html');

    // 1. Subir a DEV (/var/www/html/lg-gsp-dev/manual_operador_terreno_gsp.html)
    const remoteDev = '/var/www/html/lg-gsp-dev/manual_operador_terreno_gsp.html';
    console.log(`Subiendo a DEV: ${remoteDev}...`);
    await ssh.putFile(localFile, remoteDev);
    await ssh.execCommand(`chmod 644 "${remoteDev}"`);
    console.log('Subida a DEV completada.');

    // 2. Subir a PROD (/var/www/html/lg-gsp-prod/manual_operador_terreno_gsp.html)
    const remoteProd = '/var/www/html/lg-gsp-prod/manual_operador_terreno_gsp.html';
    console.log(`Subiendo a PROD: ${remoteProd}...`);
    await ssh.putFile(localFile, remoteProd);
    await ssh.execCommand(`chmod 644 "${remoteProd}"`);
    console.log('Subida a PROD completada.');

    // Verificar archivos
    const devCheck = await ssh.execCommand(`ls -lh "${remoteDev}"`);
    const prodCheck = await ssh.execCommand(`ls -lh "${remoteProd}"`);
    console.log('DEV file:', devCheck.stdout);
    console.log('PROD file:', prodCheck.stdout);

    console.log('\n✅ URLs públicas disponibles:');
    console.log('🔗 DEV:  https://servidor.leanglobal.cl/lg-gsp-dev/manual_operador_terreno_gsp.html');
    console.log('🔗 PROD: https://servidor.leanglobal.cl/lg-gsp-prod/manual_operador_terreno_gsp.html');

  } catch (err) {
    console.error('Error durante la subida al servidor:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

uploadManual();
