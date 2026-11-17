const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

async function main() {
  const ssh = new NodeSSH();
  console.log('🔌 Conectando por SSH a 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✅ Conexión SSH establecida con éxito.');

  const prodPath = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';
  const devPath = '/home/nodeadmin/proyectos/lean-services-gsp/src';
  const localBackendSrc = path.resolve(__dirname, '../ejecucion/backend_remoto/src');

  console.log('\n📦 1. Sincronizando en servidor remoto de PROD a DEV (excluyendo config)...');
  const syncDirs = ['controllers', 'models', 'routes', 'services', 'utils', 'middlewares'];
  for (const d of syncDirs) {
    const cpRes = await ssh.execCommand(`cp -r ${prodPath}/${d}/* ${devPath}/${d}/`);
    console.log(`  - ${d}: ${cpRes.code === 0 ? 'OK' : 'Error: ' + cpRes.stderr}`);
  }
  const cpIndex = await ssh.execCommand(`cp ${prodPath}/index.js ${devPath}/index.js`);
  console.log(`  - index.js: ${cpIndex.code === 0 ? 'OK' : 'Error: ' + cpIndex.stderr}`);

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp`);
  console.log('✅ Permisos de nodeadmin aplicados.');

  console.log('\n🔄 2. Reiniciando proceso PM2 ID 10 (DEV)...');
  const pm2Res = await ssh.execCommand('sudo -u nodeadmin pm2 restart 10');
  console.log('PM2 Output:\n', pm2Res.stdout || pm2Res.stderr);

  console.log('\n📥 3. Descargando archivos reales de PROD hacia el workspace local dev...');
  for (const d of syncDirs) {
    const localDir = path.join(localBackendSrc, d);
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    await ssh.getDirectory(localDir, `${prodPath}/${d}`, {
      recursive: true,
      concurrency: 10
    });
    console.log(`  - Descargado ${d} a ${localDir}`);
  }
  await ssh.getFile(path.join(localBackendSrc, 'index.js'), `${prodPath}/index.js`);
  console.log('  - Descargado index.js');

  console.log('\n🏥 4. Verificando salud de DEV backend (puerto 3006)...');
  const testDev = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/operaciones/control-vivo" | head -c 200');
  console.log('Test DEV 3006 Output:\n', testDev.stdout || testDev.stderr);

  ssh.dispose();
  console.log('\n🎉 Sincronización Backend PROD -> DEV completada exitosamente.');
}

main().catch(err => {
  console.error('❌ Error en script de sincronización:', err);
  process.exit(1);
});
