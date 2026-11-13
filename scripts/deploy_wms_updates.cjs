const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployUpdates() {
  console.log('1. Conectando a servidor SSH 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // 1. Backend update
  console.log('2. Subiendo inventarioModel.js a backend DEV...');
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/inventarioModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/inventarioModel.js';
  await ssh.putFile(localModel, remoteModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteModel}`);

  console.log('3. Reiniciando PM2 DEV (10)...');
  const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('   PM2 Status:', restartRes.stdout.split('\n').find(l => l.includes('10')) || restartRes.stdout.trim());

  await new Promise(r => setTimeout(r, 2000));

  // 2. Frontend update
  console.log('4. Sincronizando directorio dist con /var/www/html/lg-gsp-dev...');
  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist');
  const remoteDir = '/var/www/html/lg-gsp-dev';
  const status = await ssh.putDirectory(localDist, remoteDir, {
    recursive: true,
    concurrency: 10,
    validate: (p) => !p.includes('.git')
  });

  if (!status) throw new Error('Error transfiriendo dist');

  console.log('5. Aplicando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} && chmod -R 755 ${remoteDir}`);

  // 3. Verificación
  console.log('6. Verificando API existencias...');
  const apiTest = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/existencias"');
  try {
    const json = JSON.parse(apiTest.stdout);
    const first = json.data?.[0];
    console.log(`   Total existencias: ${json.data?.length}, Ejemplo item: SKU=${first?.sku}, id_bodega=${first?.id_bodega}, ubicacion=${first?.ubicacion_codigo}, pmp=${first?.pmp}, val_total=${first?.valorizacion_total}`);
  } catch (e) {
    console.log('   Raw output:', apiTest.stdout.substring(0, 150));
  }

  const httpDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`7. HTTP Status DEV Frontend: ${httpDev.stdout.trim()}`);

  ssh.dispose();
  console.log('\n=== Despliegue de actualización WMS completado con éxito ===');
}

deployUpdates().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
