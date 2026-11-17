const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectOT4Cols() {
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
  const cols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance' ORDER BY ordinal_position"
  );
  console.log('COLS TEDP_REPORTE_AVANCE:', cols.rows.map(c => c.column_name));

  const repRes = await pool.query(
    "SELECT r.id_reporte_avance, r.id_proyecto, r.id_equipo, e.patente, r.dia_correlativo, r.fecha_reporte, r.hora_inicio, r.hora_termino, r.horas_operadas, r.horas_facturables, r.id_user_operador, r.estado FROM sch_leangsp_prod.tedp_reporte_avance r LEFT JOIN sch_leangsp_prod.tequ_equipo e ON r.id_equipo = e.id_equipo WHERE r.id_proyecto = 33 ORDER BY r.dia_correlativo ASC, r.id_reporte_avance ASC"
  );
  console.log('REPORTES PROYECTO 33:');
  console.log(JSON.stringify(repRes.rows, null, 2));

  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_ot4_2.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_ot4_2.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectOT4Cols().catch(console.error);
