import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendSrcLocal = path.resolve(__dirname, 'src');
const backendSrcRemote = '/home/nodeadmin/proyectos/lean-services-gsp/src';

const ssh = new NodeSSH();

async function run() {
  console.log('🚀 INICIANDO DESPLIEGUE EXCLUSIVO DE BACKEND GSP EN CENTOS...');
  console.log(`Local src: ${backendSrcLocal}`);
  console.log(`Remote destination: ${backendSrcRemote}`);

  try {
    console.log('🔌 Conectando al servidor Centos via SSH...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conectado con éxito.');

    console.log('⬆️ Sincronizando directorio src del backend...');
    await ssh.putDirectory(backendSrcLocal, backendSrcRemote, {
      recursive: true,
      concurrency: 15
    });
    console.log('✅ Directorio sincronizado.');

    console.log('🔑 Ajustando permisos para nodeadmin...');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp');
    
    console.log('🔄 Reiniciando proceso PM2 "lean-services-gsp" bajo el usuario nodeadmin...');
    const pm2Res = await ssh.execCommand('sudo -u nodeadmin pm2 restart lean-services-gsp');
    console.log('PM2 Output:\n', pm2Res.stdout || pm2Res.stderr);

    console.log('🎉 DESPLIEGUE DE BACKEND COMPLETADO EXITOSAMENTE.');
  } catch (err) {
    console.error('❌ ERROR DURANTE EL DESPLIEGUE:', err.message || err);
  } finally {
    ssh.dispose();
  }
}

run();
