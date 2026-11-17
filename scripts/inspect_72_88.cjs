const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectReports72and88() {
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
  const repRes = await pool.query(
    "SELECT id_reporte_avance, id_proyecto, id_equipo, dia_correlativo, fecha_reporte, fecha_registro, id_user_operador, id_user_validador, fecha_validacion, obs_validador, estado_reporte, id_doc_pdf, token_report FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance IN (72, 88)"
  );
  console.log('REPORTS 72 & 88 DETAILS:');
  console.log(JSON.stringify(repRes.rows, null, 2));

  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_72_88.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_72_88.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectReports72and88().catch(console.error);
