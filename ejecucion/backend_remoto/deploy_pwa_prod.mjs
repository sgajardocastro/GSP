import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.join(__dirname, '..', '..');
const pwaRoot = path.join(workspaceRoot, 'ejecucion', 'pwa');
const localDist = path.join(pwaRoot, 'dist');
const remotePath = '/var/www/html/pwa-gsp-prod';

const ssh = new NodeSSH();

async function deploy() {
  console.log('🚀 Iniciando despliegue de PWA GSP a ambiente PROD (/var/www/html/pwa-gsp-prod)...');

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(pwaRoot, 'package.json'), 'utf8'));
    console.log(`📌 Versión PWA a desplegar: v${pkg.version}`);

    if (!fs.existsSync(localDist)) {
      throw new Error(`No se encontró el directorio de distribución local: ${localDist}`);
    }

    console.log('\n🔌 Conectando a servidor.leanglobal.cl:1295...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conexión SSH establecida con éxito.');

    console.log(`\n📦 Respaldando directorio remoto existente: ${remotePath}...`);
    await ssh.execCommand('mkdir -p /var/www/html/backups');
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const backupFile = `/var/www/html/backups/pwa-gsp-prod-backup-${timestamp}.tar.gz`;
    
    const checkDir = await ssh.execCommand(`ls -d ${remotePath}`);
    if (checkDir.code === 0) {
      console.log(`🗜️ Comprimiendo respaldo en ${backupFile}...`);
      await ssh.execCommand(`tar -czf ${backupFile} -C /var/www/html pwa-gsp-prod`);
      console.log('✅ Respaldo remoto creado exitosamente.');
    }

    console.log(`\n🧹 Purgando archivos APK residuales del servidor...`);
    await ssh.execCommand(`rm -f ${remotePath}/*.apk`);
    console.log('✅ APKs anteriores eliminados del servidor.');

    console.log(`\n⬆️ Subiendo archivos (${localDist} -> ${remotePath})...`);
    await ssh.putDirectory(localDist, remotePath, {
      recursive: true,
      concurrency: 15,
      tick: function(localPath, remotePath, error) {
        if (error) {
          console.error('❌ Error al transferir:', localPath, error);
        }
      }
    });
    console.log('✅ Archivos transferidos correctamente.');

    console.log('\n🔒 Asegurando permisos del directorio remoto...');
    await ssh.execCommand(`chown -R nginx:nginx ${remotePath}`);
    await ssh.execCommand(`chmod -R 755 ${remotePath}`);
    console.log('✅ Permisos ajustados con éxito (nginx:nginx 755).');

    console.log('\n🔍 Verificando disponibilidad de la PWA en el servidor...');
    const verifyApp = await ssh.execCommand(`curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-prod/`);
    console.log(`🌐 HTTP PWA PROD Status: ${verifyApp.stdout.trim()}`);

    console.log(`\n🎉 ¡Despliegue de PWA GSP v${pkg.version} en PROD completado exitosamente!`);
  } catch (err) {
    console.error('\n❌ ERROR DURANTE EL DESPLIEGUE:', err.message || err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

deploy();
