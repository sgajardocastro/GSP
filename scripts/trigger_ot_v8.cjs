const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function triggerOT() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
const proyectoModel = require('./src/models/proyectoModel');
const pm = new proyectoModel();

async function run() {
  console.log('Generando OT Version 8 para id_proyecto 86...');
  const res = await pm.generarOTVersion(86);
  console.log('Resultado generacion:', JSON.stringify(res, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error('Error generando OT:', err);
  process.exit(1);
});
`;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/trigger_ot.js\n${nodeScript}\nEOF`);
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node trigger_ot.js"');
  console.log('=== SALIDA GENERACION OT ===');
  console.log(res.stdout);
  if (res.stderr) console.error('=== STDERR ===', res.stderr);

  ssh.dispose();
}

triggerOT().catch(console.error);
