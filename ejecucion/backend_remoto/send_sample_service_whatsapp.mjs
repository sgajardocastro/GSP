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

    console.log('--- ENVIANDO NOTIFICACIÓN OPERACIONAL A SERGIO GAJARDO (+56936483259) ---');
    const mensajeTexto = `🚜 *Grúas San Pablo — Despacho Operacional*\n\n¡Hola Sergio! Has sido asignado al servicio de izaje en faena.\n\n📋 *OT:* GSP-2609-042\n🚜 *Equipo:* Grúa Telescópica LTM-1220 (BGDF.90)\n📍 *Faena:* Minera Los Pelambres • Obra Tranque\n\n📲 *Accede a tu Hoja de Ruta y Report Diario aquí:*\nhttps://servidor.leanglobal.cl/lg-gsp-dev/viaje/vj-demo-1234\n\n💡 *Flujo de prueba (5 Estados Gigantes):*\n1. [Salida Patio]: Ingresa odómetro/horómetro y PIN 1234.\n2. [En Ruta]: Prueba el botón de Combustible Copec y luego confirma llegada a faena.\n3. [En Faena]: Abre el Report Diario Día 1, ingresa horómetro de término, colación y firma con tu dedo en la pantalla táctil.`;

    const payload = JSON.stringify({
      numero: '56936483259',
      mensaje: mensajeTexto
    });

    const sendRes = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3085/enviar -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`);
    console.log('Resultado:', sendRes.stdout || sendRes.stderr);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
