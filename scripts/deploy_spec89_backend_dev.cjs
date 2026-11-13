const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployBackendSpec89() {
  console.log('=== DESPLEGANDO BACKEND SPEC-089: INTEGRACION HIBRIDA MANTENIMIENTO E INVENTARIO (DEV PM2 10) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const baseRemote = '/home/nodeadmin/proyectos/lean-services-gsp';
  const baseLocal = path.resolve(__dirname, '../ejecucion/backend_remoto');

  const files = [
    { local: 'src/models/mantenimientoModel.js', remote: `${baseRemote}/src/models/mantenimientoModel.js` },
    { local: 'src/controllers/mantenimientoController.js', remote: `${baseRemote}/src/controllers/mantenimientoController.js` },
  ];

  for (const f of files) {
    const lPath = path.join(baseLocal, f.local);
    console.log(`Subiendo ${f.local} -> ${f.remote}...`);
    await ssh.putFile(lPath, f.remote);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${f.remote}`);
  }

  console.log('\nReiniciando PM2 DEV (10)...');
  const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(restartRes.stdout.trim() || restartRes.stderr.trim());

  await new Promise(r => setTimeout(r, 2500));

  console.log('\nVerificando logs recientes de PM2 10...');
  const logsRes = await ssh.execCommand('su - nodeadmin -c "pm2 logs 10 --lines 25 --nostream"');
  console.log(logsRes.stdout.trim() || logsRes.stderr.trim());

  console.log('\nVerificando endpoint /api/mantenimiento/ots en DEV (3006)...');
  const testRes = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/mantenimiento/ots?limit=2"');
  console.log('Respuesta ots:\n', testRes.stdout.substring(0, 200));

  ssh.dispose();
  console.log('\n Backend DEV actualizado y PM2 10 operativo.');
}

deployBackendSpec89().catch(err => {
  console.error('Error desplegando backend:', err);
  process.exit(1);
});
