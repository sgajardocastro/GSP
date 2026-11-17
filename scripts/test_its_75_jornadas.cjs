const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testItsApi() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const scriptNode = `
  const fs = require('fs');
  const envContent = fs.readFileSync('/home/nodeadmin/proyectos/lean-services-gsp-prod/.env', 'utf8');
  envContent.split('\\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        let v = trimmed.substring(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[trimmed.substring(0, idx).trim()] = v;
      }
    }
  });

  const itsController = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController');

  const req = {
    params: { id_proyecto: 75 },
    user: { id_user: 17, rol: 'ADMIN' }
  };

  const res = {
    json: (response) => {
      const d = response.data || {};
      console.log('=== ITS OBJ ===');
      console.log('id_its:', d.its?.id_its);
      console.log('total_jornadas:', d.its?.total_jornadas);
      console.log('total_personal:', d.its?.total_personal);
      console.log('total_adicionales:', d.its?.total_adicionales);
      console.log('total_final:', d.its?.total_final);
      console.log('total_neto:', d.its?.total_neto);
      console.log('descuento_general:', d.its?.descuento_general);
      console.log('=== JORNADAS COUNT ===', (d.jornadas || []).length);
      (d.jornadas || []).forEach(j => {
        console.log(\`  Jornada: \${j.fecha} | \${j.patente} | \${j.tipo_servicio} | hrs: \${j.horas_report} | subtotal: \${j.subtotal}\`);
      });
      console.log('=== LINEAS ADICIONALES ===');
      console.log(JSON.stringify(d.its?.lineas_adicionales || [], null, 2));
    },
    status: (code) => {
      console.log('STATUS:', code);
      return res;
    }
  };

  (async () => {
    try {
      await itsController.getITS(req, res);
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/test_its_75_jornadas.js\n${scriptNode}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/test_its_75_jornadas.js"');
  console.log(out.stdout);
  if (out.stderr) console.error(out.stderr);

  ssh.dispose();
}
testItsApi().catch(console.error);
