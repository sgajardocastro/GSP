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

    console.log('--- 1. CONSULTANDO USUARIO JORGE EN BD ---');
    const dbRes = await ssh.execCommand('PGPASSWORD=usr_gsp_123 psql -h 127.0.0.1 -U usr_leangsp -d postgres -c "SELECT id_user, email, name_frst, apellido_pat, movil FROM sch_leangsp.tsec_users WHERE movil ILIKE \'%77501322%\' OR email ILIKE \'%jponce%\' OR name_frst ILIKE \'%jorge%\';"');
    console.log(dbRes.stdout || dbRes.stderr);

    console.log('\n--- 2. ENVIANDO MENSAJE A JORGE (+56977501322) ---');
    const mensajeTexto = `🚜 *Grúas San Pablo — Notificaciones Automáticas*\n\nHola Jorge, te saludamos del equipo técnico de LeanGlobal.\n\nEste es un mensaje de prueba para verificar la integración y el canal de mensajería automática de la plataforma GSP.\n\n✅ *Estado del canal:* Operativo y verificado\n📲 *Servicio:* Emisión automática de Report Diario para Operadores\n\nSaludos cordiales,\n*Equipo LeanGlobal / Grúas San Pablo*`;

    const payload = JSON.stringify({
      numero: '56977501322',
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
