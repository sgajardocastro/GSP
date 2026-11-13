const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

const localBase = path.join(__dirname, '..');

const filesToSync = [
  'src/models/mantenimientoModel.js',
  'src/controllers/mantenimientoController.js',
  'src/routes/mantenimientoRoutes.js',
  'src/routes/index.js'
];

const envs = [
  { name: 'DEV', pm2Id: 10, remotePath: '/home/nodeadmin/proyectos/lean-services-gsp', testUrl: 'https://servidor.leanglobal.cl/lg-gsp-dev/api/mantenimiento/ots' },
  { name: 'PROD', pm2Id: 13, remotePath: '/home/nodeadmin/proyectos/lean-services-gsp-prod', testUrl: 'https://servidor.leanglobal.cl/lg-gsp-prod/api/mantenimiento/ots' }
];

async function sync() {
  try {
    console.log('⚡ Conectando por SSH a servidor.leanglobal.cl:1295...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conexión SSH establecida con éxito.');

    for (const env of envs) {
      console.log(`\n======================================================`);
      console.log(`▶ Sincronizando backend en ambiente ${env.name} (${env.remotePath})...`);
      console.log(`======================================================`);

      for (const relFile of filesToSync) {
        const localFile = path.join(localBase, relFile);
        const remoteFile = path.posix.join(env.remotePath, relFile.replace(/\\/g, '/'));
        console.log(`  -> Subiendo ${relFile} a ${remoteFile}...`);
        await ssh.putFile(localFile, remoteFile);
      }

      console.log(`  -> Ajustando permisos (nodeadmin:nodeadmin)...`);
      await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${env.remotePath}/src`);

      console.log(`  -> Reiniciando PM2 proceso ID ${env.pm2Id}...`);
      const restartRes = await ssh.execCommand(`su - nodeadmin -c "pm2 restart ${env.pm2Id}"`);
      console.log(`  -> PM2 Restart: ${restartRes.stdout.trim().split('\n')[0]}`);

      // Esperar 2 segundos para estabilización
      await new Promise(r => setTimeout(r, 2000));

      console.log(`  -> Verificando endpoint de salud en ${env.testUrl}...`);
      const testRes = await ssh.execCommand(`curl -s "${env.testUrl}"`);
      console.log(`  -> Respuesta API (${env.name}):`, testRes.stdout.slice(0, 180));
    }

    console.log('\n🎉 ¡Despliegue y sincronización de Backend Mantenimiento completada en DEV y PROD!');
  } catch (err) {
    console.error('❌ Error durante sincronización:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

sync();
