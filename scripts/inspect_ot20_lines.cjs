const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectOT20Lines() {
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
  const p = await pool.query("SELECT codi_proyecto, json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 62");
  const jf = p.rows[0].json_field || {};
  console.log('CRM LINEAS:', JSON.stringify(jf.crm_v1?.lineas_servicio, null, 2));
  console.log('TODOS LOS REPORTES DEL PROYECTO 62:');
  const reps = await pool.query("SELECT id_reporte_avance, dia_correlativo, fecha_reporte, id_equipo, horas_facturables, estado_reporte FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 62");
  console.table(reps.rows);
  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_ot20_lines.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_ot20_lines.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectOT20Lines().catch(console.error);
