const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function triggerPdfV11() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
const ordenTrabajoPdfService = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/ordenTrabajoPdfService');

async function test() {
  console.log('Generando PDF OT 47 con versión limpia...');
  const res = await ordenTrabajoPdfService.generarOrdenTrabajoPdf(97);
  console.log('PDF GENERADO:', res);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/gen_pdf_v11.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/gen_pdf_v11.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

triggerPdfV11().catch(console.error);
