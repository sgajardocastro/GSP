const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectOT4Reports() {
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
    "SELECT r.id_reporte_avance, r.id_proyecto, r.id_equipo, e.patente, r.dia_correlativo, r.fecha_reporte, r.fecha_inicio_servicio, r.fecha_termino_servicio, r.horas_operadas, r.horas_facturables, r.id_user_operador, r.estado_reporte, r.id_doc_pdf FROM sch_leangsp_prod.tedp_reporte_avance r LEFT JOIN sch_leangsp_prod.tequ_equipo e ON r.id_equipo = e.id_equipo WHERE r.id_proyecto = 33 ORDER BY r.dia_correlativo ASC, r.id_reporte_avance ASC"
  );
  console.log('REPORTES PROYECTO 33:');
  console.log(JSON.stringify(repRes.rows, null, 2));

  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_ot4_3.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_ot4_3.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectOT4Reports().catch(console.error);
