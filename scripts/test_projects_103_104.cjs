const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testProjects103104() {
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
    for (const pid of [103, 104]) {
      try {
        console.log(\`Probando generarOTVersion(\${pid})...\`);
        const res = await model.generarOTVersion(pid);
        console.log(\`✔ Proyecto \${pid} OT generada: \${res.ot?.nombre_archivo}\`);
      } catch (e) {
        console.error(\`❌ Proyecto \${pid} error: \${e.message}\`);
      }
    }
    process.exit(0);
  })();
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/test_p5152_ot.js\n" + scriptNode + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/test_p5152_ot.js"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

testProjects103104().catch(console.error);
