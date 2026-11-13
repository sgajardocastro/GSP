import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Conectando a servidor.leanglobal.cl via SSH...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('SSH Conectado.');

    console.log('--- 1. LIMPIANDO SESIÓN CORRUPTA AUTH_INFO_BAILEYS ---');
    await ssh.execCommand('rm -rf /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys');
    console.log('Carpeta auth_info_baileys eliminada.');

    console.log('--- 2. REINICIANDO GSP-WHATSAPP EN PM2 ---');
    const pm2Cmd = 'su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && nvm use 16 && cd /home/nodeadmin/proyectos/gsp-whatsapp-service && pm2 restart gsp-whatsapp"';
    const pm2Res = await ssh.execCommand(pm2Cmd);
    console.log(pm2Res.stdout);

    console.log('--- 3. ESPERANDO INICIALIZACIÓN DE SOCKET Y QR ---');
    await new Promise(r => setTimeout(r, 4000));

    const statusRes = await ssh.execCommand('curl -s http://127.0.0.1:3085/status');
    console.log('Estado del servicio:', statusRes.stdout || statusRes.stderr);

  } catch (err) {
    console.error('Error durante reset de WhatsApp:', err);
  } finally {
    ssh.dispose();
  }
}

run();
