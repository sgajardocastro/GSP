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

    console.log('Flushing PM2 logs...');
    await ssh.execCommand('su - nodeadmin -c "pm2 flush gsp-whatsapp"');
    
    console.log('Sending message to Sergio...');
    const payload = JSON.stringify({
      numero: '56936483259',
      mensaje: '⚡ *Grúas San Pablo — Notificación Directa*\n\nComprobación de entrega sin espera: ' + new Date().toLocaleTimeString('es-CL')
    });

    const sendRes = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3085/enviar -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`);
    console.log('Resultado envio:', sendRes.stdout);

    await new Promise(r => setTimeout(r, 3000));

    const errLog = await ssh.execCommand('cat /home/nodeadmin/.pm2/logs/gsp-whatsapp-error.log');
    console.log('Nuevos errores en PM2:\n', errLog.stdout || '(Ninguno - 0 errores)');

    const outLog = await ssh.execCommand('tail -n 20 /home/nodeadmin/.pm2/logs/gsp-whatsapp-out.log');
    console.log('Salida PM2:\n', outLog.stdout);

  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}
main();
