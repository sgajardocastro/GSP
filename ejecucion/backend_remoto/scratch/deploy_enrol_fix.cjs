const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployFix() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localFile = path.resolve(__dirname, '../src/services/enrolamientoService.js');

  console.log('1. Subiendo enrolamientoService.js a DEV y PROD...');
  await ssh.putFile(localFile, '/home/nodeadmin/proyectos/lean-services-gsp/src/services/enrolamientoService.js');
  await ssh.putFile(localFile, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/enrolamientoService.js');

  console.log('2. Ajustando permisos...');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/services/enrolamientoService.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/enrolamientoService.js');

  console.log('3. Reiniciando procesos en PM2 (DEV ID 10 y PROD ID 13)...');
  const resReload = await ssh.execCommand('su - nodeadmin -c "pm2 reload 10 13"');
  console.log(resReload.stdout);

  console.log('4. Verificando que id_file ya no existe en el código remoto...');
  const resGrepDev = await ssh.execCommand('grep -n "id_file" /home/nodeadmin/proyectos/lean-services-gsp/src/services/enrolamientoService.js');
  const resGrepProd = await ssh.execCommand('grep -n "id_file" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/enrolamientoService.js');
  console.log('DEV grep id_file (debe estar vacio):', resGrepDev.stdout);
  console.log('PROD grep id_file (debe estar vacio):', resGrepProd.stdout);

  ssh.dispose();
}

deployFix().catch(console.error);
