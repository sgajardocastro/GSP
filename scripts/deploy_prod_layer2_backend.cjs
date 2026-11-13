const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function runLayer2() {
  console.log('=== CAPA 2: DESPLIEGUE BACKEND PRODUCCION (lean-services-gsp-prod / PM2 13) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const baseRemote = '/home/nodeadmin/proyectos/lean-services-gsp-prod';
  const baseLocal = path.resolve(__dirname, '../ejecucion/backend_remoto');

  const files = [
    { local: 'src/models/inventarioModel.js', remote: `${baseRemote}/src/models/inventarioModel.js` },
    { local: 'src/controllers/inventarioController.js', remote: `${baseRemote}/src/controllers/inventarioController.js` },
    { local: 'src/routes/inventarioRoutes.js', remote: `${baseRemote}/src/routes/inventarioRoutes.js` },
    { local: 'src/models/mantenimientoModel.js', remote: `${baseRemote}/src/models/mantenimientoModel.js` },
    { local: 'src/controllers/mantenimientoController.js', remote: `${baseRemote}/src/controllers/mantenimientoController.js` },
  ];

  for (const f of files) {
    const lPath = path.join(baseLocal, f.local);
    console.log(`Subiendo ${f.local} -> ${f.remote}...`);
    await ssh.putFile(lPath, f.remote);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${f.remote}`);
  }

  console.log('\nReiniciando PM2 PRODUCCIÓN (13)...');
  const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(restartRes.stdout.trim() || restartRes.stderr.trim());

  console.log('Esperando estabilización de PM2...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('\nVerificando logs de PM2 13...');
  const logsRes = await ssh.execCommand('su - nodeadmin -c "pm2 logs 13 --lines 15 --nostream"');
  console.log(logsRes.stdout.trim() || logsRes.stderr.trim());

  console.log('\nVerificando endpoint /api/inventario/traspasos en socket PROD (puerto 3016)...');
  const testRes = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/inventario/traspasos"');
  console.log('Respuesta /traspasos PROD:\n', testRes.stdout);

  ssh.dispose();
  console.log('\n✅ CAPA 2 (BACKEND PRODUCCIÓN) DESPLEGADA EXITOSAMENTE.');
}

runLayer2().catch(err => {
  console.error('Error fatal en Capa 2:', err);
  process.exit(1);
});
