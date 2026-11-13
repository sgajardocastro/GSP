import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log('1. Eliminando archivos de sesion corruptos de Sergio (LID 168349900226752 y 190899048984615 y 56936483259)...');
    const rmRes = await ssh.execCommand('rm -f /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/session-168349900226752* /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/session-190899048984615* /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/session-56936483259*');
    console.log('Resultado rm:', rmRes.stdout || rmRes.stderr || 'OK');

    console.log('2. Reiniciando gsp-whatsapp en PM2...');
    await ssh.execCommand('su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && pm2 restart gsp-whatsapp"');

    console.log('3. Esperando 4s...');
    await new Promise(r => setTimeout(r, 4000));

    const status = await ssh.execCommand('curl -s http://127.0.0.1:3085/status');
    console.log('Estado servicio:', status.stdout);

    console.log('4. Enviando mensaje de prueba a Sergio (+56936483259)...');
    const payload = JSON.stringify({
      numero: '56936483259',
      mensaje: '🔐 *Grúas San Pablo — Sistema de Notificaciones*\n\nConexión cifrada de WhatsApp restablecida exitosamente. Si ves este mensaje directamente, el canal E2E está 100% operativo.'
    });

    const sendRes = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3085/enviar -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`);
    console.log('Resultado envio:', sendRes.stdout);

    await new Promise(r => setTimeout(r, 2000));
    const logs = await ssh.execCommand('tail -n 25 /home/nodeadmin/.pm2/logs/gsp-whatsapp-error.log');
    console.log('Ultimos errores:', logs.stdout || 'Ninguno');

  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
main();
