const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function testOT() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const runCode = `
  const db = require('./src/config/database');
  const ProyectoModel = require('./src/models/proyectoModel');
  const model = new ProyectoModel(db);

  (async () => {
    try {
      const res = await model.generarOTVersion(101);
      console.log('OT GENERADA:', JSON.stringify(res, null, 2));
      process.exit(0);
    } catch (e) {
      console.error('ERROR GENERANDO OT:', e);
      process.exit(1);
    }
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/test_ot.js\n${runCode}\nEOF`);
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node test_ot.js"');
  console.log('RESULTADO GENERACION OT:\n', res.stdout || res.stderr);
  await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp-prod/test_ot.js');

  ssh.dispose();
}

testOT().catch(console.error);
