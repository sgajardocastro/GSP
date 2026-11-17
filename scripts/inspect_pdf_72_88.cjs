const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDoc1929() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');

async function test() {
  const r72 = await pool.query("SELECT id_doc_pdf, ajustes_analista FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance = 72");
  console.log('R72 id_doc_pdf:', r72.rows[0]);
  
  const r88 = await pool.query("SELECT id_doc_pdf, ajustes_analista FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance = 88");
  console.log('R88 id_doc_pdf:', r88.rows[0]);

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_pdf_72_88.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_pdf_72_88.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectDoc1929().catch(console.error);
