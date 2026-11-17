const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDocPdfs() {
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
  const docs = await pool.query(
    "SELECT id_doc, doc_nombre, file_path, fecha_creacion, id_usuario_creacion FROM sch_leangsp.tdoc_documentos WHERE id_doc IN (1929, 1943)"
  );
  console.log('DOCS:', docs.rows);

  const pRes = await pool.query(
    "SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 33"
  );
  const jf = pRes.rows[0].json_field;
  console.log('CRM lineas_servicio:', jf.crm_v1?.lineas_servicio);
  console.log('EJECUCION lineas_operativas:', jf.ejecucion_v1?.lineas_operativas);
  console.log('RELEVO / HISTORIAL:', jf.crm_v1?.turnos_equipos || jf.turnos_equipos);

  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_docs_jf.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_docs_jf.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectDocPdfs().catch(console.error);
