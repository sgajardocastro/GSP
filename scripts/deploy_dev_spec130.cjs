const path = require('path');
const fs = require('fs');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  console.log('🚀 INICIANDO DESPLIEGUE CONTROLADO A DEV (SPEC-130 / Estructurador Arbol + Motor Valorizacion)...');

  const rootDir = path.resolve(__dirname, '..');
  const localWebDist = path.join(rootDir, 'ejecucion', 'frontend', 'dist_dev');
  const localMotorService = path.join(rootDir, 'ejecucion', 'backend_remoto', 'src', 'services', 'motorValorizacionService.js');
  const localDdl = path.join(rootDir, 'ejecucion', 'backend_remoto', 'migrations', '130_01_ddl_relacional_lineas_asignaciones.sql');

  if (!fs.existsSync(localWebDist)) {
    throw new Error(`No se encontró dist_dev en: ${localWebDist}`);
  }

  console.log('\n🔌 1. Conectando por SSH a 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  console.log('✅ Conexión SSH establecida con éxito.');

  // 2. Subir Frontend Web a /var/www/html/lg-gsp-dev
  const webRemote = '/var/www/html/lg-gsp-dev';
  console.log(`\n⬆️ 2. Subiendo nuevo build de Frontend Web DEV (${localWebDist} -> ${webRemote})...`);
  const statusWeb = await ssh.putDirectory(localWebDist, webRemote, {
    recursive: true,
    concurrency: 15,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusWeb) {
    throw new Error('Fallo al transferir archivos del directorio dist_dev');
  }
  await ssh.execCommand(`chown -R nginx:nginx ${webRemote} && chmod -R 755 ${webRemote}`);
  console.log('✅ Frontend Web subido y permisos nginx aplicados.');

  // 3. Subir motorValorizacionService.js al backend
  const remoteService = '/home/nodeadmin/proyectos/lean-services-gsp/src/services/motorValorizacionService.js';
  console.log(`\n⬆️ 3. Sincronizando motorValorizacionService.js en ${remoteService}...`);
  await ssh.putFile(localMotorService, remoteService);
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp');
  console.log('✅ Backend motorValorizacionService.js subido.');

  // 4. Reiniciar PM2 proceso 10
  console.log('\n🔄 4. Reiniciando proceso PM2 ID 10 (lean-services-gsp)...');
  const pm2Res = await ssh.execCommand('sudo -u nodeadmin pm2 restart 10');
  console.log('PM2 Status:', pm2Res.stdout.split('\n').filter(l => l.includes('10') || l.includes('online')).slice(0, 4).join(' | '));

  // 5. Aplicar DDL en Base de Datos DEV (sch_leangsp)
  console.log('\n🗄️ 5. Aplicando DDL 130_01 en PostgreSQL DEV (sch_leangsp)...');
  const remoteDdlPath = '/tmp/130_01_ddl_dev.sql';
  await ssh.putFile(localDdl, remoteDdlPath);
  const ddlRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteDdlPath}"`);
  console.log('PostgreSQL DDL Output:\n', ddlRes.stdout || ddlRes.stderr);
  await ssh.execCommand(`rm -f ${remoteDdlPath}`);

  // 6. Verificación HTTP DEV
  console.log('\n🌐 6. Verificación de estado HTTP DEV...');
  const httpRes = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('HTTP Status DEV:', httpRes.stdout.trim());

  ssh.dispose();
  console.log('\n🎉 DESPLIEGUE A DEV COMPLETADO CON ÉXITO.');
}

main().catch(err => {
  console.error('❌ Error en despliegue a DEV:', err);
  process.exit(1);
});
