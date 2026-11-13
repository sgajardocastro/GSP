const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployExportFix() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localFile = path.resolve(__dirname, '../src/services/exportService.js');

  console.log('1. Subiendo exportService.js a DEV y PROD...');
  await ssh.putFile(localFile, '/home/nodeadmin/proyectos/lean-services-gsp/src/services/exportService.js');
  await ssh.putFile(localFile, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/exportService.js');

  console.log('2. Ajustando permisos...');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/services/exportService.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/exportService.js');

  console.log('3. Reiniciando procesos en PM2 (DEV ID 10 y PROD ID 13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');
  console.log('PM2 reloaded');

  ssh.dispose();
}

deployExportFix().catch(console.error);
