const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function triggerOT47() {
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
  console.log('Generando OT Version 8 para id_proyecto 97 (GSP-2611-00047)...');
  const res = await pm.generarOTVersion(97);
  console.log('Resultado generacion:', JSON.stringify(res.ot, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error('Error generando OT 47:', err);
  process.exit(1);
});
`;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/trigger_ot47.js\n${nodeScript}\nEOF`);
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node trigger_ot47.js"');
  console.log('=== SALIDA GENERACION OT 47 ===');
  console.log(res.stdout);
  if (res.stderr) console.error('=== STDERR ===', res.stderr);

  // Clean up
  await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp-prod/trigger_ot47.js');
  ssh.dispose();
}

triggerOT47().catch(console.error);
