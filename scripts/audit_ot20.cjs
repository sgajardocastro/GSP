const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function auditOT20() {
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
  console.log('--- 1. PROYECTO 62 (OT 20) ---');
  const proyRes = await pool.query(
    "SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 62"
  );
  console.log(proyRes.rows);

  console.log('\\n--- 2. TPRY_REL_EQUIPO PROYECTO 62 ---');
  const relEq = await pool.query(
    "SELECT re.id_rel_equipo, re.id_equipo, e.patente, e.modelo, re.rol_equipo, re.fecha_plan_ini, re.fecha_plan_fin, re.estado_real FROM sch_leangsp_prod.tpry_rel_equipo re JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = 62 ORDER BY re.id_rel_equipo ASC"
  );
  console.table(relEq.rows);

  console.log('\\n--- 3. REPORTES 46 Y 87 ---');
  const repRes = await pool.query(
    "SELECT r.id_reporte_avance, r.dia_correlativo, r.fecha_reporte, r.id_equipo, e.patente, r.horas_operadas, r.horas_facturables, r.estado_reporte, r.id_doc_pdf, r.token_report, r.fecha_registro, r.ajustes_analista FROM sch_leangsp_prod.tedp_reporte_avance r JOIN sch_leangsp_prod.tequ_equipo e ON r.id_equipo = e.id_equipo WHERE r.id_reporte_avance IN (46, 87)"
  );
  console.log(JSON.stringify(repRes.rows, null, 2));

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/audit_ot20.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/audit_ot20.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

auditOT20().catch(console.error);
