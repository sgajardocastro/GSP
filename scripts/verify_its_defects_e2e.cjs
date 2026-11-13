const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. AUDITORÍA API GET /api/operaciones/its/32 (PROD) ===');
  const curlRes = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/its/32');
  const data = JSON.parse(curlRes.stdout);

  console.log('Personal asignado (Matías Barrales debe ser Rigger):');
  console.log(data.data.asignaciones.personal);

  console.log('\nJornadas (Registro de Viaje debe incluir tipo_viaje y comentario_viaje):');
  console.log(data.data.jornadas.map(j => ({
    patente: j.patente,
    tipo_servicio: j.tipo_servicio,
    tipo_viaje: j.tipo_viaje,
    comentario_viaje: j.comentario_viaje,
    conductor: j.conductor_nombre
  })));

  console.log('\nCostos Movilización (tipo_movilizacion + ruta_detalle):');
  console.log(data.data.costos.movilizacion);

  console.log('\nCostos Alimentación (condicion_label editable):');
  console.log(data.data.costos.alimentacion.map(a => ({
    nombre: a.nombre_personal,
    condicion_label: a.condicion_label,
    concepto_detalle: a.concepto_detalle,
    monto: a.monto_total
  })));

  console.log('\n=== 2. AUDITORÍA PDF PUPPETEER OT 32 ===');
  await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/its/preview-pdf/32 -o /tmp/preview_ot32_puntos124.pdf');
  await ssh.execCommand('pdftotext /tmp/preview_ot32_puntos124.pdf /tmp/preview_ot32_puntos124.txt');
  const txtRes = await ssh.execCommand('cat /tmp/preview_ot32_puntos124.txt');
  const pdfTxt = txtRes.stdout;

  console.log('¿Aparece (IDA Y RETORNO) en tabla de Jornadas?:', pdfTxt.includes('IDA Y RETORNO'));
  console.log('¿Aparece comentario del viaje en tabla de Jornadas?:', pdfTxt.includes('Traslado y apoyo'));
  console.log('¿Aparece UBER / TAXI en movilización?:', pdfTxt.includes('UBER / TAXI'));
  console.log('¿Aparece Ida y Regreso en el Día en alimentación?:', pdfTxt.includes('Ida y Regreso en el Día'));
  console.log('¿Aparece MATIAS BARRALES (RIGGER)?:', pdfTxt.includes('MATIAS BARRALES (RIGGER)') || pdfTxt.includes('MATÍAS BARRALES (RIGGER)'));

  console.log('\nExtracto representativo de la tabla de Jornadas y Costos en PDF:');
  const lines = pdfTxt.split('\n').filter(l => l.trim().length > 0);
  const startJor = lines.findIndex(l => l.includes('CONTROL DE FLOTA'));
  if (startJor !== -1) {
    lines.slice(startJor, startJor + 45).forEach(l => console.log('  |', l));
  }

  ssh.dispose();
}

main().catch(console.error);
