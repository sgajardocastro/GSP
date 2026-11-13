import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('🔌 Conectando a servidor.leanglobal.cl:1295 vía SSH...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conectado.');

    const remoteDir = '/home/nodeadmin/proyectos/lean-services-gsp';
    const bdDir = path.join(__dirname, '..', 'bd');

    console.log('📤 Subiendo archivos de migración...');
    await ssh.putFile(path.join(bdDir, '20261010_mnt_enterprise.sql'), `${remoteDir}/20261010_mnt_enterprise.sql`);
    await ssh.putFile(path.join(bdDir, 'seed_mnt_enterprise.sql'), `${remoteDir}/seed_mnt_enterprise.sql`);
    await ssh.putFile(path.join(__dirname, 'apply_mnt_migration.js'), `${remoteDir}/apply_mnt_migration.js`);

    console.log('⚙️ Ejecutando migración en PostgreSQL DEV...');
    const res = await ssh.execCommand('node apply_mnt_migration.js', { cwd: remoteDir });
    console.log(res.stdout);
    if (res.stderr) console.error('STDERR:', res.stderr);

    console.log('🧹 Limpiando archivos temporales...');
    await ssh.execCommand(`rm -f ${remoteDir}/20261010_mnt_enterprise.sql ${remoteDir}/seed_mnt_enterprise.sql ${remoteDir}/apply_mnt_migration.js`);
    console.log('🏁 Proceso de migración finalizado.');

  } catch (err) {
    console.error('❌ Error en ejecución remota:', err);
  } finally {
    ssh.dispose();
  }
}

run();
