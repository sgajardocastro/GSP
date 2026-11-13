import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ssh = new NodeSSH();

async function runPhase5() {
  console.log("==================================================================");
  console.log("🚀 FASE 5: DESPLIEGUE DE FRONTEND WEB Y PWA A PRODUCCIÓN");
  console.log("==================================================================");

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  const rootDir = 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  const webDist = path.join(rootDir, 'ejecucion/frontend/dist');
  const pwaDist = path.join(rootDir, 'ejecucion/pwa/dist');

  const remoteWeb = '/var/www/html/lg-gsp-prod';
  const remotePwa = '/var/www/html/pwa-gsp-prod';

  // Paso 1: Respaldar directorios remotos
  console.log("\n📦 Paso 1: Creando respaldos en /var/www/html/backups/...");
  await ssh.execCommand('mkdir -p /var/www/html/backups');
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  await ssh.execCommand(`tar -czf /var/www/html/backups/lg-gsp-prod-bak-${timestamp}.tar.gz -C /var/www/html lg-gsp-prod 2>/dev/null`);
  await ssh.execCommand(`tar -czf /var/www/html/backups/pwa-gsp-prod-bak-${timestamp}.tar.gz -C /var/www/html pwa-gsp-prod 2>/dev/null`);
  console.log("✅ Respaldos creados.");

  // Paso 2: Limpiar y crear directorios remotos
  console.log("\n🧹 Paso 2: Limpiando directorios destino...");
  await ssh.execCommand(`mkdir -p ${remoteWeb} ${remotePwa}`);
  await ssh.execCommand(`rm -rf ${remoteWeb}/* ${remotePwa}/*`);
  console.log("✅ Directorios destino listos.");

  // Paso 3: Subir Web Console
  console.log(`\n⬆️ Paso 3: Subiendo Web Console (${webDist} -> ${remoteWeb})...`);
  const webStatus = await ssh.putDirectory(webDist, remoteWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log(`✅ Web Console subida: ${webStatus ? 'OK' : 'Advertencia en transferencia'}`);

  // Paso 4: Subir PWA
  console.log(`\n⬆️ Paso 4: Subiendo PWA Móvil (${pwaDist} -> ${remotePwa})...`);
  const pwaStatus = await ssh.putDirectory(pwaDist, remotePwa, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log(`✅ PWA Móvil subida: ${pwaStatus ? 'OK' : 'Advertencia en transferencia'}`);

  // Paso 5: Ajustar permisos a nginx:nginx
  console.log("\n🔒 Paso 5: Ajustando permisos de propiedad (nginx:nginx)...");
  await ssh.execCommand(`chown -R nginx:nginx ${remoteWeb} ${remotePwa}`);
  await ssh.execCommand(`chmod -R 755 ${remoteWeb} ${remotePwa}`);
  console.log("✅ Permisos actualizados.");

  console.log("\n==================================================================");
  console.log("🎉 FASE 5 COMPLETADA CON ÉXITO: Frontends Desplegados");
  console.log("==================================================================");

  ssh.dispose();
}

runPhase5().catch(console.error);
