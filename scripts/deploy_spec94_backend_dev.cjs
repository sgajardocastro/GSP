const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployBackendSpec94() {
  console.log('=== DESPLEGANDO BACKEND SPEC-094: TRASPASOS & TRASLADOS ENTRE BODEGAS (DEV PM2 10) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const baseRemote = '/home/nodeadmin/proyectos/lean-services-gsp';
  const baseLocal = path.resolve(__dirname, '../ejecucion/backend_remoto');

  const files = [
    { local: 'src/models/inventarioModel.js', remote: `${baseRemote}/src/models/inventarioModel.js` },
    { local: 'src/controllers/inventarioController.js', remote: `${baseRemote}/src/controllers/inventarioController.js` },
    { local: 'src/routes/inventarioRoutes.js', remote: `${baseRemote}/src/routes/inventarioRoutes.js` },
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

  console.log('\nVerificando endpoint /api/inventario/traspasos en DEV...');
  const testRes = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/traspasos"');
  console.log('Respuesta /traspasos:\n', testRes.stdout.substring(0, 300));

  ssh.dispose();
  console.log('\n Backend DEV actualizado con SPEC-094 y PM2 10 operativo.');
}

deployBackendSpec94().catch(err => {
  console.error('Error desplegando backend:', err);
  process.exit(1);
});
