const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deploySimulador() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localFile = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/frontend/public/navegacion_cotizacion_web.html';

  console.log('Subiendo navegacion_cotizacion_web.html a lg-gsp-dev y lg-gsp-prod...');
  await ssh.putFile(localFile, '/var/www/html/lg-gsp-dev/navegacion_cotizacion_web.html');
  await ssh.putFile(localFile, '/var/www/html/lg-gsp-prod/navegacion_cotizacion_web.html');

  const res1 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/navegacion_cotizacion_web.html');
  console.log('HTTP Status https://servidor.leanglobal.cl/lg-gsp-dev/navegacion_cotizacion_web.html:', res1.stdout.trim());

  const res2 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/navegacion_cotizacion_web.html');
  console.log('HTTP Status https://servidor.leanglobal.cl/lg-gsp-prod/navegacion_cotizacion_web.html:', res2.stdout.trim());

  ssh.dispose();
}

deploySimulador().catch(console.error);
