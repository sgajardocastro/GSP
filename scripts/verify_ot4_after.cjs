const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function verifyOT4State() {
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
    "SELECT r.id_reporte_avance, r.dia_correlativo, r.fecha_reporte, r.id_equipo, e.patente, r.horas_facturables, r.estado_reporte, r.ajustes_analista->>'evidencia_fisica_adjunta' as evidencia FROM sch_leangsp_prod.tedp_reporte_avance r JOIN sch_leangsp_prod.tequ_equipo e ON r.id_equipo = e.id_equipo WHERE r.id_proyecto = 33 ORDER BY r.dia_correlativo ASC, r.id_reporte_avance ASC"
  );
  console.log('REPORTE FINAL OT 00004:');
  console.table(repRes.rows);

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/verify_ot4_after.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/verify_ot4_after.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

verifyOT4State().catch(console.error);
