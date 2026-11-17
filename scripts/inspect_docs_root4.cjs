const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDocPdfsPostgresProdEnv() {
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
  const pRes = await pool.query(
    "SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 33"
  );
  const jf = pRes.rows[0].json_field || {};
  const crm = jf.crm_v1 || {};
  console.log('CRM lineas_servicio:', JSON.stringify(crm.lineas_servicio, null, 2));
  console.log('TURNOS EQUIPOS:', JSON.stringify(crm.turnos_equipos || jf.turnos_equipos, null, 2));

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_docs_root4.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_docs_root4.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectDocPdfsPostgresProdEnv().catch(console.error);
