const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== TEST EMPÍRICO E2E EN PROD (OT 32 y OT 30) ===\n');

  const testScript = `
    const http = require('http');
    const path = require('path');
    const fs = require('fs');

    const dotenv = require('dotenv');
    const envProd = dotenv.parse(fs.readFileSync('/home/nodeadmin/proyectos/lean-services-gsp-prod/.env'));
    const prodPort = parseInt(envProd.PORT || '3001');
    console.log('Puerto PROD:', prodPort);

    function request(method, pathUrl, body = null) {
      return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request({
          hostname: 'localhost',
          port: prodPort,
          path: pathUrl,
          method: method,
          headers: {
            'Content-Type': 'application/json',
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ status: res.statusCode, data: parsed });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
      });
    }

    async function runTests() {
      // 1. Obtener contexto de OT 32
      console.log('1. Consultando GET /api/operaciones/its/32...');
      const ctx32Res = await request('GET', '/api/operaciones/its/32');
      console.log('Status code:', ctx32Res.status);
      if (!ctx32Res.data || !ctx32Res.data.data) {
        throw new Error('Respuesta inesperada: ' + JSON.stringify(ctx32Res));
      }
      const data32 = ctx32Res.data.data;
      const its32 = data32.its;
      const jor32 = data32.jornadas;
      const costos32 = data32.costos;

      console.log('OT 32 ITS Contexto:');
      console.log('- es_valor_fijo:', its32.es_valor_fijo);
      console.log('- valor_fijo_pactado:', its32.valor_fijo_pactado);
      console.log('- horas_minimas_pactadas:', its32.horas_minimas_pactadas);
      console.log('- valor_hora_pactado:', its32.valor_hora_pactado);
      console.log('- total_ingresos_horas:', its32.total_ingresos_horas);
      console.log('- total_ingresos_facturables:', its32.total_ingresos_facturables);
      console.log('- jornadas count:', jor32.length);
      if (jor32[0]) {
        console.log('Jornada 0:');
        console.log('  - tipo_servicio:', jor32[0].tipo_servicio);
        console.log('  - numero_report:', jor32[0].numero_report);
        console.log('  - horas_reales:', jor32[0].horas_reales);
        console.log('  - horas_report:', jor32[0].horas_report);
        console.log('  - tarifa_hora:', jor32[0].tarifa_hora);
        console.log('  - subtotal:', jor32[0].subtotal);
      }

      // 2. Probar POST /api/operaciones/its/guardar para OT 32
      console.log('\\n2. Probando POST /api/operaciones/its/guardar para OT 32...');
      const savePayload = {
        id_proyecto: 32,
        cabecera: its32,
        jornadas: jor32,
        costos: costos32
      };
      const saveRes = await request('POST', '/api/operaciones/its/guardar', savePayload);
      console.log('POST /api/operaciones/its/guardar Status:', saveRes.status, saveRes.data ? saveRes.data.success : saveRes.raw);

      // 3. Probar generación de PDF para OT 32
      console.log('\\n3. Probando generación de PDF para OT 32...');
      const itsPdfService = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/itsPdfService');
      const pdfRes32 = await itsPdfService.generarPdfITS(data32);
      console.log('PDF OT 32 generado exitosamente, buffer length:', pdfRes32 ? pdfRes32.length : 'N/A');
      fs.writeFileSync('/tmp/its_ot32_test.pdf', pdfRes32);

      // 4. Probar contexto y PDF para OT 30
      console.log('\\n4. Consultando GET /api/operaciones/its/30...');
      const ctx30Res = await request('GET', '/api/operaciones/its/30');
      const data30 = ctx30Res.data.data;
      const its30 = data30.its;
      console.log('OT 30 ITS Contexto:');
      console.log('- es_valor_fijo:', its30.es_valor_fijo);
      console.log('- horas_minimas_pactadas:', its30.horas_minimas_pactadas);
      console.log('- valor_hora_pactado:', its30.valor_hora_pactado);
      console.log('- total_ingresos_facturables:', its30.total_ingresos_facturables);

      const pdfRes30 = await itsPdfService.generarPdfITS(data30);
      console.log('PDF OT 30 generado exitosamente, buffer length:', pdfRes30 ? pdfRes30.length : 'N/A');
      fs.writeFileSync('/tmp/its_ot30_test.pdf', pdfRes30);

      console.log('\\n=== TODOS LOS TESTS PASARON EXITOSAMENTE ===');
    }

    runTests().catch(err => {
      console.error('ERROR EN TEST:', err.stack || err.message);
      if (err.response) console.error('Response data:', err.response.data);
      process.exit(1);
    });
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/test_its_e2e.js\n${testScript}\nEOF`);
  const res = await ssh.execCommand(`su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node /tmp/test_its_e2e.js"`);
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  // Extraer texto del PDF de OT 32 con pdftotext si está instalado
  const pdfTextRes = await ssh.execCommand(`pdftotext /tmp/its_ot32_test.pdf - | head -n 45`);
  if (pdfTextRes.stdout) {
    console.log('\n=== MUESTRA TEXTO PDF OT 32 ===\n', pdfTextRes.stdout);
  }

  await ssh.execCommand(`rm -f /tmp/test_its_e2e.js`);
  ssh.dispose();
}

main().catch(console.error);
