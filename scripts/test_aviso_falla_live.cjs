const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testAviso() {
  console.log('=== VERIFICANDO DESPACHO REAL DE AVISO CON PARADA DE MÁQUINA EN DEV ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // Consultar primer id_equipo válido
  const eqRes = await ssh.execCommand('curl -s http://127.0.0.1:3006/api/mantenimiento/flota/radar');
  const radarData = JSON.parse(eqRes.stdout);
  const eqValido = radarData.data?.[0];
  console.log(`Equipo de prueba seleccionado: ID=${eqValido?.id_equipo} (${eqValido?.patente} - ${eqValido?.modelo})`);

  // Probar invocación del endpoint de aviso con criticidad PARADA_MAQUINA y fotos adjuntas
  const payload = JSON.stringify({
    id_equipo: eqValido.id_equipo,
    criticidad: 'PARADA_MAQUINA',
    descripcion_sintoma: 'Prueba Falla Crítica en Motor Hidráulico - Evidencia Fotográfica',
    descripcion: 'Prueba Falla Crítica en Motor Hidráulico - Evidencia Fotográfica',
    horometro: 1250.4,
    id_user: 55,
    nombre_usuario: 'Sergio Gajardo',
    fotos: [{ id_doc: 1001, url: 'https://servidor.leanglobal.cl/lg-gsp-dev/api/v1/storage/view/1001' }]
  }).replace(/'/g, "'\\''");

  const curlCmd = `curl -s -X POST http://127.0.0.1:3006/api/mantenimiento/avisos -H "Content-Type: application/json" -d '${payload}'`;

  console.log('\nEnviando POST /api/mantenimiento/avisos con PARADA_MAQUINA...');
  const resCurl = await ssh.execCommand(curlCmd);
  console.log('Respuesta endpoint:\n', resCurl.stdout);

  // Ver los logs recientes de PM2 para verificar el despacho
  const pm2Logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs lean-services-gsp --lines 25 --nostream"');
  console.log('\nLogs de PM2 (lean-services-gsp):\n', pm2Logs.stdout);

  ssh.dispose();
  console.log('\n=== PRUEBA CONCLUIDA ===');
}

testAviso().catch(console.error);
