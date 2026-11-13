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

    console.log('--- 1. ELIMINANDO SESIONES CORRUPTAS DE SERGIO GAJARDO ---');
    const rmRes = await ssh.execCommand('rm -f /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/session-168349900226752* /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/session-56936483259*');
    console.log('rm result:', rmRes.stdout || rmRes.stderr || 'OK');

    console.log('--- 2. REINICIANDO SERVICIO PM2 ---');
    await ssh.execCommand('su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && nvm use 16 && pm2 restart gsp-whatsapp"');
    
    console.log('Esperando 4 segundos a reconexión...');
    await new Promise(r => setTimeout(r, 4000));

    console.log('--- 3. ENVIANDO MENSAJE DE PRUEBA TRAS RESET DE SESION ---');
    const payload = JSON.stringify({
      numero: '56936483259',
      mensaje: '✅ *Grúas San Pablo — Prueba de Conexión Cifrada*\n\n¡Hola Sergio! Si estás leyendo este mensaje con texto claro (sin reloj ni "Esperando el mensaje"), la sincronización E2E de WhatsApp se restableció exitosamente.'
    });

    const sendRes = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3085/enviar -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`);
    console.log('Resultado envío:', sendRes.stdout || sendRes.stderr);

    console.log('\n--- 4. LOGS PM2 POST-ENVIO ---');
    await new Promise(r => setTimeout(r, 2000));
    const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs gsp-whatsapp --lines 20 --nostream"');
    console.log(logs.stdout);

  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}

run();
