const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deploy() {
  console.log('🚀 Desplegando condiciones comerciales oficiales y validez de 5 días...');
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  
  // 1. Backend
  console.log('Actualizando proyectoModel.js en DEV y PROD...');
  const localModel = `${rootDir}/ejecucion/backend_remoto/src/models/proyectoModel.js`;
  await ssh.putFile(localModel, '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js');
  await ssh.putFile(localModel, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp /home/nodeadmin/proyectos/lean-services-gsp-prod');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');
  console.log('✅ Backend actualizado y PM2 reiniciado.');

  // 2. Frontend Web
  console.log('Subiendo Frontend Web a DEV y PROD...');
  const localWebDist = `${rootDir}/ejecucion/frontend/dist`;
  await ssh.putDirectory(localWebDist, '/var/www/html/lg-gsp-dev', { recursive: true, concurrency: 10 });
  await ssh.putDirectory(localWebDist, '/var/www/html/lg-gsp-prod', { recursive: true, concurrency: 10 });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev /var/www/html/lg-gsp-prod && chmod -R 755 /var/www/html/lg-gsp-dev /var/www/html/lg-gsp-prod');
  await ssh.execCommand('systemctl reload nginx');
  console.log('✅ Frontend Web subido y Nginx recargado.');

  // 3. Verificación
  const devCheck = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodCheck = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`HTTP DEV: ${devCheck.stdout} | HTTP PROD: ${prodCheck.stdout}`);

  ssh.dispose();
  console.log('🎉 Despliegue de condiciones comerciales y validez 5 días completado.');
}

deploy().catch(console.error);
