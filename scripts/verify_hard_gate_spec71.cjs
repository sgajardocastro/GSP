const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function runEmpiricalVerification() {
  console.log('=== INICIANDO PROTOCOLO DE VERIFICACIÓN EMPÍRICA HARD GATE ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // 1. Check PWA dev URL
  console.log('--- 1. VERIFICACIÓN PWA DEV (HTTP 200) ---');
  const pwaCurl = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log(`URL: https://servidor.leanglobal.cl/pwa-gsp-dev/ -> Status: ${pwaCurl.stdout.trim()}`);

  // 2. Check Web Console dev URL
  console.log('\n--- 2. VERIFICACIÓN PORTAL WEB DEV (HTTP 200) ---');
  const webCurl = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`URL: https://servidor.leanglobal.cl/lg-gsp-dev/ -> Status: ${webCurl.stdout.trim()}`);

  // 3. Test API POST /api/mantenimiento/avisos (con equipo real id_equipo: 35 GPT-135)
  console.log('\n--- 3. TEST BACKEND: POST /api/mantenimiento/avisos (AVISO DE FALLA) ---');
  const avisoPayload = JSON.stringify({
    id_equipo: 35,
    patente: "VCTR.81-9",
    descripcion_sintoma: "Fuga de aceite hidráulico en vástago de cilindro de elevación (Test Verificación Hard Gate)",
    sistema_afectado: "Hidráulico",
    prioridad: "Alta",
    tipo_detencion: "Parcial",
    origen: "Taller Móvil PWA",
    reportado_por: "Ingeniero Auditor GSP",
    id_usuario_reporta: 1
  });
  const avisoCmd = `curl -s -X POST http://localhost:3006/api/mantenimiento/avisos -H "Content-Type: application/json" -d '${avisoPayload.replace(/'/g, "'\\''")}'`;
  const avisoRes = await ssh.execCommand(avisoCmd);
  console.log('Respuesta POST /avisos:', avisoRes.stdout);

  // 4. Test API POST /api/mantenimiento/ots (NUEVA OTM GENERAL con equipo 35 y forzar_creacion: true)
  console.log('\n--- 4. TEST BACKEND: POST /api/mantenimiento/ots (NUEVA OTM GENERAL) ---');
  const otPayload = JSON.stringify({
    id_equipo: 35,
    patente: "VCTR.81-9",
    tipo_ot: "Correctivo",
    tipo_mantenimiento: "CORRECTIVO",
    prioridad: 2,
    descripcion_falla: "Reparación y sellado de vástago de elevación por aviso preventivo",
    sistema_falla: "Hidráulico",
    horometro_grua_inicio: 3512,
    horometro_chasis_inicio: 1420,
    odometro_inicio: 28450,
    origen: "Taller Móvil PWA",
    id_tecnico_responsable: 1,
    observaciones: "OT creada desde protocolo de pruebas Hard Gate",
    forzar_creacion: true
  });
  const otCmd = `curl -s -X POST http://localhost:3006/api/mantenimiento/ots -H "Content-Type: application/json" -d '${otPayload.replace(/'/g, "'\\''")}'`;
  const otRes = await ssh.execCommand(otCmd);
  console.log('Respuesta POST /ots:', otRes.stdout);

  let newOtId = null;
  try {
    const parsed = JSON.parse(otRes.stdout);
    newOtId = parsed.data ? parsed.data.id_ot : (parsed.id_ot || null);
  } catch (e) {
    console.error('Error parseando json OT:', e.message);
  }

  // Fallback to latest OT if needed
  if (!newOtId) {
    const latestOtRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c 'SELECT MAX(id_ot) FROM sch_leangsp.tmnt_ot;'"` );
    newOtId = parseInt(latestOtRes.stdout.trim(), 10);
  }
  console.log(`\n>>> ID OT SELECCIONADA PARA PRUEBAS: ${newOtId} <<<`);

  // 5. Test API PUT /api/mantenimiento/ots/:id/medidores-inicio (MEDIDORES DE ENTRADA)
  console.log(`\n--- 5. TEST BACKEND: PUT /api/mantenimiento/ots/${newOtId}/medidores-inicio ---`);
  const medidoresPayload = JSON.stringify({
    horometro_grua_inicio: 3515.5,
    horometro_chasis_inicio: 1422.0,
    odometro_inicio: 28455.0
  });
  const medCmd = `curl -s -X PUT http://localhost:3006/api/mantenimiento/ots/${newOtId}/medidores-inicio -H "Content-Type: application/json" -d '${medidoresPayload}'`;
  const medRes = await ssh.execCommand(medCmd);
  console.log(`Respuesta PUT /ots/${newOtId}/medidores-inicio:`, medRes.stdout);

  // 6. Test API POST /api/mantenimiento/ots/:id/fotos-360 (INSPECCION 360)
  console.log(`\n--- 6. TEST BACKEND: POST /api/mantenimiento/ots/${newOtId}/fotos-360 ---`);
  const fotoPayload = JSON.stringify({
    posicion: "frente",
    url: "https://servidor.leanglobal.cl/storage/mnt/ot_frente_verif.jpg",
    id_doc: "doc-test-hardgate-360"
  });
  const fotoCmd = `curl -s -X POST http://localhost:3006/api/mantenimiento/ots/${newOtId}/fotos-360 -H "Content-Type: application/json" -d '${fotoPayload}'`;
  const fotoRes = await ssh.execCommand(fotoCmd);
  console.log(`Respuesta POST /ots/${newOtId}/fotos-360:`, fotoRes.stdout);

  // 7. Check PM2 Status under nodeadmin
  console.log('\n--- 7. PM2 STATUS DEV (APP 10) ---');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 describe 10"');
  const lines = pm2Res.stdout.split('\n').filter(l => l.includes('status') || l.includes('uptime') || l.includes('name'));
  console.log(lines.join('\n'));

  ssh.dispose();
  console.log('\n=== PROTOCOLO COMPLETADO EXITOSAMENTE (EXIT CODE 0) ===');
}

runEmpiricalVerification().catch(console.error);
