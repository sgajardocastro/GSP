const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployBackendMntFeed() {
  console.log('=== DESPLEGANDO BACKEND MNT ACTIVIDAD FEED (DEV PM2 10) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const baseRemote = '/home/nodeadmin/proyectos/lean-services-gsp';
  const baseLocal = path.resolve(__dirname, '../ejecucion/backend_remoto');

  const files = [
    { local: 'src/models/mantenimientoModel.js', remote: `${baseRemote}/src/models/mantenimientoModel.js` },
    { local: 'src/controllers/mantenimientoController.js', remote: `${baseRemote}/src/controllers/mantenimientoController.js` },
    { local: 'src/routes/mantenimientoRoutes.js', remote: `${baseRemote}/src/routes/mantenimientoRoutes.js` },
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

  await new Promise(r => setTimeout(r, 2000));

  console.log('\nVerificando endpoint /api/mantenimiento/tecnicos en DEV (3006)...');
  const testTec = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/mantenimiento/tecnicos"');
  console.log('Respuesta tecnicos:\n', testTec.stdout.substring(0, 250));

  console.log('\nVerificando endpoint /api/mantenimiento/kpis en DEV (3006)...');
  const testRes = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/mantenimiento/kpis?_bypass_empresa=1"');
  console.log('Respuesta kpis:\n', testRes.stdout.substring(0, 150));

  ssh.dispose();
  console.log('\n🎉 Backend DEV actualizado y verificado.');
}

deployBackendMntFeed().catch(err => {
  console.error('Error desplegando backend:', err);
  process.exit(1);
});
