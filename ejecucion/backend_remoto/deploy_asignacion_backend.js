const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deployAsignacion() {
  try {
    console.log('Connecting to server...');
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });
    console.log('Connected!');

    // 1. Subir y ejecutar script de migración DDL
    const localMigrationFile = path.join(__dirname, 'db_migration_asignacion_recursos.js');
    const remoteMigrationFile = '/home/nodeadmin/proyectos/lean-services-gsp/db_migration_asignacion_recursos.js';
    
    console.log('Uploading migration script...');
    await ssh.putFile(localMigrationFile, remoteMigrationFile);
    await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/db_migration_asignacion_recursos.js');

    console.log('Executing PostgreSQL migration remotely...');
    const migrationResult = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node db_migration_asignacion_recursos.js"');
    console.log('Migration output:', migrationResult.stdout);
    if (migrationResult.stderr) console.error('Migration stderr:', migrationResult.stderr);

    // 2. Subir controladores y rutas (src/)
    const localSrcDir = path.join(__dirname, 'src');
    const remoteDestDir = '/home/nodeadmin/proyectos/lean-services-gsp/src';

    console.log(`Uploading ${localSrcDir} to ${remoteDestDir}...`);
    await ssh.putDirectory(localSrcDir, remoteDestDir, {
      recursive: true,
      concurrency: 10
    });

    console.log('Fixing permissions...');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');

    // 3. Reiniciar backend PM2
    console.log('Restarting PM2 process as nodeadmin...');
    const pm2Result = await ssh.execCommand('su - nodeadmin -c "pm2 restart lean-services-gsp"');
    console.log('PM2 restart output:', pm2Result.stdout);

    console.log('🎉 Despliegue de migración BD y Backend de Asignación completado exitosamente!');
  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    ssh.dispose();
  }
}

deployAsignacion();
