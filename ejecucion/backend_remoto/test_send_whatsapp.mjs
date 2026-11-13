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

    console.log('--- 1. CONSULTANDO USUARIO EN BASE DE DATOS ---');
    const dbRes = await ssh.execCommand('PGPASSWORD=usr_gsp_123 psql -h 127.0.0.1 -U usr_leangsp -d postgres -c "SELECT id_usuario, email, nombre, movil, telefono FROM sch_leangsp.tsec_usuario WHERE email ILIKE \'%sgajardo%\';"');
    console.log(dbRes.stdout || dbRes.stderr);

    console.log('\n--- 2. ENVIANDO MENSAJE DE PRUEBA POR WHATSAPP ---');
    const mensajeTexto = `🚜 *Grúas San Pablo — Sistema de Notificaciones*\n\n¡Hola Sergio! 👋\n\nEste es un mensaje de prueba emitido automáticamente desde el nuevo microservicio de WhatsApp en *servidor.leanglobal.cl*.\n\n✅ *Estado:* Microservicio Activo en PM2 (nodeadmin)\n📲 *Destinatario:* +56936483259\n📅 *Fecha/Hora:* ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}\n\nEste canal se utilizará para despachar los links directos del *Report Diario de Izaje* a los operadores en faena.`;

    const payload = JSON.stringify({
      numero: '56936483259',
      mensaje: mensajeTexto
    });

    const sendRes = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3085/enviar -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`);
    console.log('Resultado del Envío:', sendRes.stdout || sendRes.stderr);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
