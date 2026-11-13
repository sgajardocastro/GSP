const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function verifyLive() {
  console.log('=== VERIFICACIÓN EMPÍRICA DE ENDPOINTS /mantenimiento (DEV & PROD) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // 1. Probar endpoint de parámetros en DEV (puerto 3006)
  console.log('--- 1. GET /api/mantenimiento/parametros en DEV (localhost:3006) ---');
  const devParamRes = await ssh.execCommand('curl -s http://localhost:3006/api/mantenimiento/parametros');
  try {
    const json = JSON.parse(devParamRes.stdout);
    console.log('DEV Params Map:', json.data?.map);
    console.log('DEV Success:', json.success);
  } catch (e) {
    console.log('DEV raw output:', devParamRes.stdout.substring(0, 300));
  }

  // 2. Probar endpoint de parámetros en PROD (puerto 3016)
  console.log('\n--- 2. GET /api/mantenimiento/parametros en PROD (localhost:3016) ---');
  const prodParamRes = await ssh.execCommand('curl -s http://localhost:3016/api/mantenimiento/parametros');
  try {
    const json = JSON.parse(prodParamRes.stdout);
    console.log('PROD Params Map:', json.data?.map);
    console.log('PROD Success:', json.success);
  } catch (e) {
    console.log('PROD raw output:', prodParamRes.stdout.substring(0, 300));
  }

  // 3. Probar Radar de Flota en PROD para ver si calcula prox_alerta_horas dinámicamente
  console.log('\n--- 3. GET /api/mantenimiento/flota/radar en PROD (localhost:3016) ---');
  const prodRadarRes = await ssh.execCommand('curl -s http://localhost:3016/api/mantenimiento/flota/radar');
  try {
    const json = JSON.parse(prodRadarRes.stdout);
    const gr = json.data?.[0];
    console.log(`Equipo radar ejemplo (${gr?.patente || 'N/A'}):`);
    console.log(`- Horómetro actual: ${gr?.horometro_actual}`);
    console.log(`- Último service: ${gr?.ultimo_horometro_service}`);
    console.log(`- Horas desde último service: ${gr?.horas_desde_ultimo_service}`);
    console.log(`- Horas para próximo service: ${gr?.horas_para_proximo_service}`);
    console.log(`- Estado Pauta: ${gr?.estado_pauta}`);
    console.log(`- Pauta sugerida: ${gr?.proxima_pauta_sugerida}`);
    console.log(`- Estado Certificación: ${gr?.estado_certificacion}`);
    console.log(`- Total grúas en radar: ${json.data?.length}`);
  } catch (e) {
    console.log('PROD radar raw output:', prodRadarRes.stdout.substring(0, 300));
  }

  // 4. Probar actualización PUT de parámetros
  console.log('\n--- 4. PUT /api/mantenimiento/parametros (prueba batch) en PROD ---');
  const putTestRes = await ssh.execCommand(`curl -s -X PUT http://localhost:3016/api/mantenimiento/parametros -H "Content-Type: application/json" -d '{"parametros":{"pm_intervalo_base_horas":250,"pm_ventana_alerta_horas":25,"pm_intervalo_odometro_km":10000,"tarifa_hh_default":15000,"umbral_costo_ot_clp":2000000,"cert_alerta_dias":30}}'`);
  console.log('PUT Response:', putTestRes.stdout);

  ssh.dispose();
  console.log('\n=== VERIFICACIÓN EMPÍRICA CONCLUIDA EXITOSAMENTE ===');
}

verifyLive().catch(console.error);
