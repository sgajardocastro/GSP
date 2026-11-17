const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testOldProjects() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const testOtScript = `
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

  const ProyectoModel = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel');
  const model = new ProyectoModel();

  (async () => {
    try {
      console.log('--- PROBANDO OT 1 (Proyecto ID 30: GSP-2611-00001) ---');
      const r30 = await model.generarOTVersion(30);
      console.log('✔ OT 30 generada con éxito:', r30);

      console.log('--- PROBANDO OT 4 (Proyecto ID 33: GSP-2611-00004) ---');
      const r33 = await model.generarOTVersion(33);
      console.log('✔ OT 33 generada con éxito:', r33);
    } catch (e) {
      console.error('❌ Error en prueba OT:', e.message);
      console.error(e.stack);
    }
    process.exit(0);
  })();
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/test_old_ot.js\n${testOtScript}\nEOF`);
  const testRes = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/test_old_ot.js"');
  console.log('Resultado prueba OTs antiguas:\n', testRes.stdout);
  if (testRes.stderr) console.error('STDERR:', testRes.stderr);

  ssh.dispose();
}
testOldProjects().catch(console.error);
