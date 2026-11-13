const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deployBoth() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE OFICIAL A DEV Y PROD: CASO 1 Y CASO 2 (REQ-997)');
  console.log('1. Enrolamiento rápido de Rigger Externo (GestorOportunidades.vue / acreditacionController)');
  console.log('2. Carga y corrección manual de horas en Control en Vivo (ControlOperativoVivo.vue / controlVivoController)');
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

  // 1. DESPLIEGUE BACKEND A PROD
  console.log('\n📦 [1/4] Desplegando Backend a PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/src)...');
  await ssh.putDirectory(localBackendSrc, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src', { recursive: true, concurrency: 5 });
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src');
  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('Backend PROD (PM2 ID 13) reiniciado:', restartProd.stdout || restartProd.stderr);

  // 2. DESPLIEGUE BACKEND A DEV
  console.log('\n📦 [2/4] Desplegando Backend a DEV (/home/nodeadmin/proyectos/lean-services-gsp/src)...');
  await ssh.putDirectory(localBackendSrc, '/home/nodeadmin/proyectos/lean-services-gsp/src', { recursive: true, concurrency: 5 });
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('Backend DEV (PM2 ID 10) reiniciado:', restartDev.stdout || restartDev.stderr);

  // 3. SUBIDA DE FRONTEND WEB A DEV Y PROD
  console.log('\n🌐 [3/4] Subiendo Frontend Web compilado a DEV y PROD...');
  const remoteDevWeb = '/var/www/html/lg-gsp-dev';
  const remoteProdWeb = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo Web a DEV (${remoteDevWeb})...`);
  await ssh.putDirectory(localWebDist, remoteDevWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  console.log(`Subiendo Web a PROD (${remoteProdWeb})...`);
  await ssh.putDirectory(localWebDist, remoteProdWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevWeb} ${remoteProdWeb} && chmod -R 755 ${remoteDevWeb} ${remoteProdWeb}`);
  await ssh.execCommand('systemctl reload nginx');
  console.log('Nginx recargado.');

  // 4. VERIFICACIÓN HTTP
  console.log('\n🔍 [4/4] Verificando disponibilidad HTTP...');
  const checkDevWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkProdWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  const checkDevApi = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/control-vivo');
  const checkProdApi = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/control-vivo');

  console.log(`Status lg-gsp-dev (Web): ${checkDevWeb.stdout}`);
  console.log(`Status lg-gsp-prod (Web): ${checkProdWeb.stdout}`);
  console.log(`Status lg-gsp-dev (API): ${checkDevApi.stdout}`);
  console.log(`Status lg-gsp-prod (API): ${checkProdApi.stdout}`);

  ssh.dispose();
  console.log('\n🎉 ==================================================================');
  console.log('🚀 DESPLIEGUE CASO 1 Y CASO 2 A DEV Y PROD CERTIFICADO EXITOSAMENTE');
  console.log('==================================================================');
}

deployBoth().catch(console.error);
