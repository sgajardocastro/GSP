const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testGenerarOTProd() {
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
        const k = trimmed.substring(0, idx).trim();
        let v = trimmed.substring(idx + 1).trim();
        v = v.replace(/^['"]|['"]$/g, '');
        process.env[k] = v;
      }
    }
  });

  const ProyectoModel = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel');
  const model = new ProyectoModel();
  (async () => {
    try {
      console.log('Iniciando prueba generarOTVersion(86)...');
      const res = await model.generarOTVersion(86);
      console.log('✔ OT GENERADA CON ÉXITO:');
      console.log('Versión OT:', res.ot?.version_ot);
      console.log('PDF Path:', res.ot?.path_ot_pdf);
    } catch (e) {
      console.error('❌ ERROR AL GENERAR OT:', e.message);
      console.error(e.stack);
    }
    process.exit(0);
  })();
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/test_node_ot.js\n" + scriptNode + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/test_node_ot.js"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

testGenerarOTProd().catch(console.error);
