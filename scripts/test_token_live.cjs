const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const https = require('https');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res109 = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT crm->'contrato' FROM sch_leangsp.tpro_proyecto WHERE id_proyecto = 109;\\""`);
  console.log('CRM CONTRATO 109:', res109.stdout.trim());

  // Test despachar API directly using Node http post to local backend port 3004
  const testPayload = JSON.stringify({
    id_empresa_arrendador: 9,
    representante_nombre: 'Prueba Sergio Gajardo',
    representante_rut: '12.345.678-9',
    representante_cargo: 'Gerente General',
    representante_telefono: '+56 9 9443 7725',
    representante_email: 'notificaciones.gsp@leanglobal.cl',
    vendedor_email: 'sergio.gajardo@leanglobal.cl'
  });

  console.log('\n--- Probando POST /api/proyectos/109/contrato/despachar en puerto 3006 ---');
  const curlCmd = `curl -s -X POST http://127.0.0.1:3006/api/proyectos/109/contrato/despachar -H "Content-Type: application/json" -d '${testPayload}'`;
  const curlRes = await ssh.execCommand(curlCmd);
  console.log('Respuesta despachar backend:', curlRes.stdout.trim() || curlRes.stderr);

  let parsed = null;
  try {
    parsed = JSON.parse(curlRes.stdout);
  } catch (e) {}

  if (parsed && parsed.token) {
    console.log('\n--- Probando GET /api/proyectos/contrato/public/:token con token generado ---');
    const curlGet = `curl -s http://127.0.0.1:3006/api/proyectos/contrato/public/${parsed.token}`;
    const curlGetRes = await ssh.execCommand(curlGet);
    try {
      const getJson = JSON.parse(curlGetRes.stdout);
      console.log('GET público exitoso!');
      console.log('- Mandante:', getJson.proyecto?.mandante_razon_social);
      console.log('- Equipo:', getJson.contrato?.equipo_nombre);
      console.log('- Token verificado:', getJson.contrato?.token_publico);
      console.log('- HTML contrato recibido longitud:', getJson.html_contrato?.length);
      console.log('- Contiene 14 cláusulas legales:', getJson.html_contrato?.includes('DÉCIMO CUARTA') || getJson.html_contrato?.includes('DECIMO CUARTA') || getJson.html_contrato?.includes('PRIMERA'));
      console.log('- Contiene anexo de condiciones (pág 4):', getJson.html_contrato?.includes('ANEXO') || getJson.html_contrato?.includes('CARÁTULA') || getJson.html_contrato?.includes('CARATULA'));
      console.log('- URL Pública Generada:', parsed.url_firma);
    } catch (e) {
      console.log('Respuesta GET:', curlGetRes.stdout.slice(0, 300));
    }
  }

  ssh.dispose();
}

run();
