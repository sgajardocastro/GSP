const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function deploy() {
  console.log('🚀 Iniciando despliegue de PWA GSP (DEV con Banner de Marcha Blanca)...');

  try {
    const localDist = path.resolve(__dirname, '../../pwa/dist');
    const remotePath = '/var/www/html/pwa-gsp-dev';

    console.log(`📁 Directorio local: ${localDist}`);
    if (!fs.existsSync(localDist)) {
      throw new Error(`No existe el directorio ${localDist}`);
    }

    console.log('🔌 Conectando SSH a servidor.leanglobal.cl:1295...');
    await ssh.connect({
      host: '138.255.103.18',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.',
      readyTimeout: 20000
    });
    console.log('✅ SSH Conectado.');

    console.log(`📦 Respaldando directorio remoto: ${remotePath}...`);
    await ssh.execCommand('mkdir -p /var/www/html/backups');
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const backupFile = `/var/www/html/backups/pwa-gsp-dev-backup-${timestamp}.tar.gz`;
    await ssh.execCommand(`tar -czf ${backupFile} -C /var/www/html pwa-gsp-dev 2>/dev/null`);
    console.log(`✅ Respaldo creado en ${backupFile}`);

    console.log(`🧹 Limpiando directorio destino ${remotePath}...`);
    await ssh.execCommand(`mkdir -p ${remotePath}`);
    await ssh.execCommand(`rm -rf ${remotePath}/*`);

    console.log(`⬆️ Subiendo archivos (${localDist} -> ${remotePath})...`);
    const status = await ssh.putDirectory(localDist, remotePath, {
      recursive: true,
      concurrency: 12,
      validate: (itemPath) => !itemPath.includes('.map')
    });
    console.log(`✅ Archivos transferidos: ${status ? 'OK' : 'Advertencia en transferencia'}`);

    console.log('🔒 Ajustando permisos...');
    await ssh.execCommand(`chown -R nginx:nginx ${remotePath}`);
    await ssh.execCommand(`chmod -R 755 ${remotePath}`);

    console.log('🔄 Recargando Nginx...');
    await ssh.execCommand('systemctl reload nginx');

    console.log('🔍 Verificando URL remota...');
    const res = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
    console.log(`🌐 HTTP Status pwa-gsp-dev: ${res.stdout.trim()}`);

    const indexContent = await ssh.execCommand('head -n 5 /var/www/html/pwa-gsp-dev/index.html');
    console.log('📄 Contenido index.html remoto:\n', indexContent.stdout);

    console.log('🎉 Despliegue de PWA DEV completado con éxito!');
  } catch (err) {
    console.error('❌ Error durante el despliegue:', err.message || err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

deploy();
