const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testOT30() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== TEST API GET /api/operaciones/its/30 (PROD) ===');
  const curlRes = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/its/30');
  const data = JSON.parse(curlRes.stdout);

  console.log('Proyecto 30 - Tipo servicio:', data.data?.proyecto?.tipo_servicio);
  console.log('Personal asignado:', data.data?.asignaciones?.personal?.map(p => ({
    id: p.id_user,
    nombre: `${p.name_frst} ${p.apellido_pat}`,
    rol: p.rol_personal
  })));
  console.log('Equipos asignados:', data.data?.asignaciones?.equipos?.map(e => ({
    patente: e.patente,
    modelo: e.modelo,
    conductor: e.conductor_nombre,
    rigger: e.rigger_nombre
  })));
  console.log('Jornadas:', data.data?.jornadas?.map(j => ({
    patente: j.patente,
    tipo_servicio: j.tipo_servicio,
    tipo_viaje: j.tipo_viaje,
    comentario_viaje: j.comentario_viaje
  })));

  console.log('\n=== TEST PDF PREVIEW OT 30 ===');
  const pdfRes = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/its/preview-pdf/30 -o /tmp/preview_ot30.pdf && pdftotext /tmp/preview_ot30.pdf /tmp/preview_ot30.txt && head -n 40 /tmp/preview_ot30.txt');
  console.log(pdfRes.stdout);

  ssh.dispose();
}

testOT30().catch(console.error);
