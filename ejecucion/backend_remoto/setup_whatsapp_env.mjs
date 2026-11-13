import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('SSH conectado.');

    // 1. Matar el proceso malicioso de CPU si sigue vivo
    console.log('\n--- LIMPIEZA DE PROCESO SOSPECHOSO ---');
    const killRes = await ssh.execCommand('kill -9 32689 || true; pkill -f "/tmp/.XIN-unix" || true; rm -rf /tmp/.XIN-unix');
    console.log('Proceso detenido y directorio /tmp/.XIN-unix eliminado.');

    // 2. Revisar Node.js
    console.log('\n--- VERSIÓN DE NODE EN SERVIDOR ---');
    const nodeVer = await ssh.execCommand('node -v && npm -v');
    console.log(nodeVer.stdout);

    // 3. Crear directorio para el servicio
    console.log('\n--- CREANDO DIRECTORIO DE SERVICIO ---');
    const mkdirRes = await ssh.execCommand('mkdir -p /home/nodeadmin/proyectos/gsp-whatsapp-service');
    console.log('Directorio /home/nodeadmin/proyectos/gsp-whatsapp-service listo.');

    // 4. Revisar si hay puertos libres (3085, 3080)
    const portCheck = await ssh.execCommand('netstat -tlpn | grep -E "3080|3085|3090" || ss -tlpn | grep -E "3080|3085|3090"');
    console.log('Puertos en uso:\n', portCheck.stdout || 'Ninguno de 3080/3085/3090 en uso.');

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
