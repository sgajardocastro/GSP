const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployBackendClean() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localSrc = path.resolve(__dirname, '../src');

  console.log('1. Subiendo src completo a PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/src)...');
  await ssh.putDirectory(localSrc, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src', {
    recursive: true,
    concurrency: 10
  });

  console.log('2. Subiendo src completo a DEV (/home/nodeadmin/proyectos/lean-services-gsp/src)...');
  await ssh.putDirectory(localSrc, '/home/nodeadmin/proyectos/lean-services-gsp/src', {
    recursive: true,
    concurrency: 10
  });

  console.log('3. Ajustando permisos nodeadmin:nodeadmin...');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');

  console.log('4. Verificando que no quede NINGUNA ocurrencia de sch_leangsp. en el servidor remoto...');
  const resGrepProd = await ssh.execCommand('grep -rn "sch_leangsp\\." /home/nodeadmin/proyectos/lean-services-gsp-prod/src/*.js /home/nodeadmin/proyectos/lean-services-gsp-prod/src/*/*.js 2>/dev/null');
  console.log('PROD grep sch_leangsp. (debe estar vacio):', resGrepProd.stdout || 'VACIO (PERFECTO)');

  const resGrepDev = await ssh.execCommand('grep -rn "sch_leangsp\\." /home/nodeadmin/proyectos/lean-services-gsp/src/*.js /home/nodeadmin/proyectos/lean-services-gsp/src/*/*.js 2>/dev/null');
  console.log('DEV grep sch_leangsp. (debe estar vacio):', resGrepDev.stdout || 'VACIO (PERFECTO)');

  console.log('5. Reiniciando PM2 (DEV ID 10 y PROD ID 13)...');
  const resReload = await ssh.execCommand('su - nodeadmin -c "pm2 reload 10 13"');
  console.log(resReload.stdout);

  ssh.dispose();
}

deployBackendClean().catch(console.error);
