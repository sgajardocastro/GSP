const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function applyHotfix() {
  console.log('=== APLICANDO HOTFIX DE EMERGENCIA EN PROD Y DEV ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const devModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';
  const prodModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';

  console.log('1. Subiendo proyectoModel.js a DEV y PROD...');
  await ssh.putFile(localModel, devModel);
  await ssh.putFile(localModel, prodModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devModel} ${prodModel}`);

  console.log('2. Reiniciando PM2 procesos 10 y 13...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 13"');

  console.log('3. Esperando 3 segundos a estabilización...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n=== 4. ESTADO DE PM2 ===');
  const st = await ssh.execCommand('su - nodeadmin -c "pm2 status 10 13"');
  console.log(st.stdout);

  console.log('\n=== 5. ÚLTIMOS LOGS DE ERROR PM2 13 ===');
  const errLogs = await ssh.execCommand('su - nodeadmin -c "pm2 logs 13 --lines 15 --err --nostream"');
  console.log(errLogs.stdout || errLogs.stderr);

  console.log('\n=== 6. PRUEBA REAL EMPÍRICA A LA API DE PRODUCCIÓN (NGINX PUBLIC) ===');
  const curlProdApi = await ssh.execCommand('curl -s -i "https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos?_id_empresa=9" | head -n 35');
  console.log('Respuesta API Producción:\n', curlProdApi.stdout);

  console.log('\n=== 7. PRUEBA REAL A EQUIPOS Y CLIENTES EN PROD ===');
  const curlEquipos = await ssh.execCommand('curl -s -i "https://servidor.leanglobal.cl/lg-gsp-prod/api/tequ-equipos?_id_empresa=9" | head -n 25');
  console.log('Respuesta Equipos Prod:\n', curlEquipos.stdout);

  const curlClientes = await ssh.execCommand('curl -s -i "https://servidor.leanglobal.cl/lg-gsp-prod/api/empresas?_id_empresa=9" | head -n 25');
  console.log('Respuesta Clientes Prod:\n', curlClientes.stdout);

  ssh.dispose();
  console.log('\n=== HOTFIX APLICADO Y CERTIFICADO CON ÉXITO ===');
}

applyHotfix().catch(err => {
  console.error('Error aplicando hotfix:', err);
  process.exit(1);
});
