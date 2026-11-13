const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function fixSession() {
  console.log('Conectando a servidor SSH para reparar sesión WhatsApp...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('1. Respaldando y purgando archivos de sesión corruptos de 56936483259...');
  const cmdBackup = `
    mkdir -p /home/nodeadmin/proyectos/gsp-whatsapp-service/_bak_sessions &&
    mv /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/session-56936483259.*.json /home/nodeadmin/proyectos/gsp-whatsapp-service/_bak_sessions/ 2>/dev/null || true
  `;
  const resBackup = await ssh.execCommand(cmdBackup);
  console.log('Resultado purga:', resBackup.stdout || 'Archivos movidos a _bak_sessions');

  console.log('2. Reiniciando servicio PM2 17 (gsp-whatsapp)...');
  const resPm2 = await ssh.execCommand('su - nodeadmin -c "pm2 restart 17"');
  console.log('PM2 restart:\n', resPm2.stdout);

  console.log('3. Esperando 4 segundos a que Baileys reconecte el socket...');
  await new Promise(r => setTimeout(r, 4000));

  console.log('4. Verificando estado en puerto 3085...');
  const resStatus = await ssh.execCommand('curl -s http://127.0.0.1:3085/status');
  console.log('Estado WhatsApp:\n', resStatus.stdout);

  console.log('5. Enviando mensaje de prueba con negociación de llaves limpia...');
  const testPayload = JSON.stringify({
    numero: '56936483259',
    mensaje: '🟢 *GSP Operaciones — Notificaciones WhatsApp*\n\nConexión criptográfica reestablecida exitosamente. Canal listo para pruebas de mantenimiento.'
  });
  const resSend = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3085/enviar -H "Content-Type: application/json" -d '${testPayload}'`);
  console.log('Resultado envío de prueba:\n', resSend.stdout);

  ssh.dispose();
}

fixSession().catch(err => {
  console.error('Error reparando sesión WhatsApp:', err);
  process.exit(1);
});
