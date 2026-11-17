const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDocPdfsPostgres() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/lg_dev?sslmode=disable'
});

async function test() {
  const docs = await pool.query(
    "SELECT id_doc, doc_nombre, file_path, fecha_creacion, id_usuario_creacion FROM sch_leangsp.tdoc_documentos WHERE id_doc IN (1929, 1943)"
  );
  console.log('DOCS IN sch_leangsp:', docs.rows);

  const pRes = await pool.query(
    "SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 33"
  );
  const jf = pRes.rows[0].json_field;
  console.log('CRM lineas_servicio:', JSON.stringify(jf.crm_v1?.lineas_servicio, null, 2));
  console.log('TURNOS EQUIPOS:', JSON.stringify(jf.crm_v1?.turnos_equipos, null, 2));

  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_docs_root.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('node /tmp/inspect_docs_root.js');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectDocPdfsPostgres().catch(console.error);
