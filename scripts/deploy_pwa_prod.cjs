const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deploy() {
  console.log('--- Conectando a servidor de producción ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida exitosamente.');

  // 1. Backup previo
  console.log('1. Creando backup de pwa-gsp-prod actual...');
  await ssh.execCommand('mkdir -p /tmp/backup_pwa_prod && cp -r /var/www/html/pwa-gsp-prod /tmp/backup_pwa_prod/pwa-gsp-prod-bak-1.0.65-$(date +%Y%m%d%H%M%S)');

  // 2. Subir tarball
  const localTar = 'd:\\SGajardo\\Google Drive\\Antigravity\\pwa_clean_release\\ejecucion\\pwa\\dist_1.0.66.tar.gz';
  const remoteTar = '/tmp/dist_1.0.66.tar.gz';
  console.log(`2. Subiendo ${localTar} a ${remoteTar}...`);
  await ssh.putFile(localTar, remoteTar);
  console.log('Subida de artefacto tar.gz completada.');

  // 3. Descomprimir en /var/www/html/pwa-gsp-prod/
  console.log('3. Descomprimiendo en /var/www/html/pwa-gsp-prod/...');
  const extractRes = await ssh.execCommand('tar -xzf /tmp/dist_1.0.66.tar.gz -C /var/www/html/pwa-gsp-prod/');
  if (extractRes.stderr) {
    console.error('Error al descomprimir:', extractRes.stderr);
  } else {
    console.log('Descompresión limpia completada.');
  }

  // 4. Ajustar permisos
  console.log('4. Ajustando permisos...');
  await ssh.execCommand('chmod -R 755 /var/www/html/pwa-gsp-prod/');

  // 5. Verificación
  console.log('5. Verificando versión desplegada en index.html y bundle...');
  const lsRes = await ssh.execCommand('ls -lt /var/www/html/pwa-gsp-prod/js/app.*.js | head -n 1');
  console.log('Archivo app principal:', lsRes.stdout.trim());

  const appFile = lsRes.stdout.trim().split(/\s+/).pop();
  if (appFile) {
    const verRes = await ssh.execCommand(`grep -o '"1.0.66"' "${appFile}" || grep -o '1.0.66' "${appFile}"`);
    console.log('Coincidencia de versión 1.0.66 en bundle:', verRes.stdout.trim());
  }

  // 6. Prueba HTTP local en el servidor
  console.log('6. Verificando respuesta HTTP Nginx...');
  const curlRes = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/pwa-gsp-prod/ | head -n 5');
  console.log(curlRes.stdout);

  // Limpieza de tar temporal
  await ssh.execCommand('rm -f /tmp/dist_1.0.66.tar.gz');

  ssh.dispose();
  console.log('--- Despliegue PWA v1.0.66 en Producción Finalizado con Éxito ---');
}

deploy().catch(err => {
  console.error('Error durante el despliegue:', err);
  process.exit(1);
});
