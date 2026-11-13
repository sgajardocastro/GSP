const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();
const path = require('path');

async function deployDev() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE A DEV: MANEJO DE EXCEPCIONES (SPEC 63 §12)');
  console.log('1. Control en Vivo: Marca de Regularización Documental');
  console.log('2. Mesa ITS: + Doc Físico (Vía A) y + Piso Mínimo (Vía B)');
  console.log('3. PDF Service: Renderizado formal de linajes probatorios');
  console.log('==================================================================');

  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.',
    readyTimeout: 30000
  });
  console.log('✅ Conectado como root por SSH.');

  const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  const localBackendSrc = `${rootDir}/ejecucion/backend_remoto/src`;
  const localWebDist = `${rootDir}/ejecucion/frontend/dist`;

  // 1. DESPLIEGUE BACKEND A DEV
  console.log('\n📦 [1/2] Desplegando Backend a DEV (/home/nodeadmin/proyectos/lean-services-gsp/src)...');
  await ssh.putFile(
    `${localBackendSrc}/services/itsPdfService.js`,
    '/home/nodeadmin/proyectos/lean-services-gsp/src/services/itsPdfService.js'
  );
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('Backend DEV (PM2 ID 10) reiniciado:', restartDev.stdout.trim() || restartDev.stderr.trim());

  // 2. SUBIDA DE FRONTEND WEB A DEV
  console.log('\n🌐 [2/2] Subiendo Frontend Web compilado a DEV (/var/www/html/lg-gsp-dev)...');
  const remoteDevWeb = '/var/www/html/lg-gsp-dev';
  await ssh.putDirectory(localWebDist, remoteDevWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevWeb} && chmod -R 755 ${remoteDevWeb}`);
  await ssh.execCommand('systemctl reload nginx');
  console.log('Nginx recargado.');

  // 3. VERIFICACIÓN HTTP
  console.log('\n🔍 Verificando estado HTTP en DEV...');
  const urls = [
    'https://servidor.leanglobal.cl/lg-gsp-dev/',
    'https://servidor.leanglobal.cl/lg-gsp-dev/centro_documentacion_gsp.html',
    'https://servidor.leanglobal.cl/lg-gsp-dev/politica_manejo_excepciones_gsp.html'
  ];

  for (const url of urls) {
    const res = await ssh.execCommand(`curl -s -o /dev/null -w "%{http_code}" ${url}`);
    console.log(`  [${res.stdout.trim()}] ${url}`);
  }

  ssh.dispose();
  console.log('\n✅ Despliegue a DEV completado con éxito.');
}

deployDev().catch(err => {
  console.error('❌ Error durante el despliegue:', err);
  process.exit(1);
});
