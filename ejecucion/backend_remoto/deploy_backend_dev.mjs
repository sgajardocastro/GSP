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

    console.log('📤 Subiendo archivos de backend actualizados...');
    await ssh.putFile(path.join(__dirname, 'src', 'models', 'mantenimientoModel.js'), `${remoteDir}/src/models/mantenimientoModel.js`);
    await ssh.putFile(path.join(__dirname, 'src', 'controllers', 'mantenimientoController.js'), `${remoteDir}/src/controllers/mantenimientoController.js`);
    await ssh.putFile(path.join(__dirname, 'src', 'routes', 'mantenimientoRoutes.js'), `${remoteDir}/src/routes/mantenimientoRoutes.js`);
    await ssh.putFile(path.join(__dirname, 'src', 'services', 'mantenimientoAlertasService.js'), `${remoteDir}/src/services/mantenimientoAlertasService.js`);
    await ssh.putFile(path.join(__dirname, 'index.js'), `${remoteDir}/index.js`);
    console.log('✅ Archivos transferidos.');

    console.log('🔍 Verificando sintaxis Node en el servidor...');
    const check1 = await ssh.execCommand('node --check src/models/mantenimientoModel.js src/controllers/mantenimientoController.js src/routes/mantenimientoRoutes.js src/services/mantenimientoAlertasService.js index.js', { cwd: remoteDir });
    if (check1.stderr) {
      console.error('❌ Error de sintaxis en servidor:', check1.stderr);
      return;
    }
    console.log('✅ Sintaxis validada sin errores.');

    console.log('🔄 Reiniciando PM2 app 10 (DEV) como nodeadmin...');
    const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"', { cwd: remoteDir });
    console.log(pm2Res.stdout);

    console.log('📊 Verificando estado PM2...');
    const statusRes = await ssh.execCommand('su - nodeadmin -c "pm2 describe 10"', { cwd: remoteDir });
    console.log(statusRes.stdout);

    console.log('🏁 Despliegue de Backend DEV completado con éxito.');

  } catch (err) {
    console.error('❌ Error en despliegue backend:', err);
  } finally {
    ssh.dispose();
  }
}

run();
