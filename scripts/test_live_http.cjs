const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testLiveHttpEndpoint() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const testScript = `
  const http = require('http');
  const fs = require('fs');

  const envContent = fs.readFileSync('/home/nodeadmin/proyectos/lean-services-gsp-prod/.env', 'utf8');
  let port = 3016;
  let secret = 'secret';
  envContent.split('\\n').forEach(l => {
    if (l.startsWith('PORT=')) port = l.split('=')[1].trim();
    if (l.startsWith('JWT_SECRET=')) secret = l.split('=')[1].trim();
  });

  const jwt = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/jsonwebtoken');
  const token = jwt.sign({ id_user: 17, rol: 'ADMIN', username: 'admin' }, secret, { expiresIn: '1h' });

  const options = {
    hostname: '127.0.0.1',
    port: port,
    path: '/api/operaciones/its/75',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('HTTP STATUS:', res.statusCode);
      try {
        const json = JSON.parse(data);
        const d = json.data || {};
        console.log('=== HTTP 200 OK RESPUESTA REAL DE PRODUCCION ===');
        console.log('id_its:', d.its?.id_its);
        console.log('folio_its:', d.its?.folio_its);
        console.log('es_valor_fijo:', d.its?.es_valor_fijo);
        console.log('valor_hora_pactado:', d.its?.valor_hora_pactado);
        console.log('valor_flete_pactado:', d.its?.valor_flete_pactado);
        console.log('total_horas_report:', d.its?.total_horas_report);
        console.log('total_ingresos_horas:', d.its?.total_ingresos_horas);
        console.log('total_ingresos_fletes:', d.its?.total_ingresos_fletes);
        console.log('total_ingresos_facturables:', d.its?.total_ingresos_facturables);
        console.log('total_costos_operacionales:', d.its?.total_costos_operacionales);
        console.log('utilidad_bruta:', d.its?.utilidad_bruta);
        console.log('margen_porcentaje:', d.its?.margen_porcentaje);
        console.log('jornadas count:', (d.jornadas || []).length);
        (d.jornadas || []).forEach(j => {
          console.log(\`  Jornada: \${j.fecha} | \${j.patente} | \${j.tipo_servicio} | tarifa: \${j.tarifa_hora} | subtotal: \${j.subtotal}\`);
        });
      } catch (e) {
        console.log('RAW BODY:', data.slice(0, 300));
      }
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error('HTTP ERROR:', e);
    process.exit(1);
  });

  req.end();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/test_live_http2.js\n${testScript}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/test_live_http2.js"');
  console.log(out.stdout);
  if (out.stderr) console.error(out.stderr);
  ssh.dispose();
}

testLiveHttpEndpoint().catch(console.error);
