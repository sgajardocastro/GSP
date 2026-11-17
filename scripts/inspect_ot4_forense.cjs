const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectOT4() {
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
  console.log('--- 1. PROYECTO GSP-2611-00004 ---');
  const proyRes = await pool.query(
    "SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto = 'GSP-2611-00004'"
  );
  console.log('PROYECTO:', proyRes.rows);
  if (proyRes.rows.length === 0) return;
  const idProy = proyRes.rows[0].id_proyecto;

  console.log('--- 2. TPRY_REL_EQUIPO ---');
  const relEqRes = await pool.query(
    "SELECT re.id_rel_equipo, re.id_equipo, e.patente, e.modelo, re.rol_equipo, re.fecha_plan_ini, re.fecha_plan_fin, re.estado_real FROM sch_leangsp_prod.tpry_rel_equipo re JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = $1 ORDER BY re.fecha_plan_ini ASC, re.id_rel_equipo ASC",
    [idProy]
  );
  console.log(JSON.stringify(relEqRes.rows, null, 2));

  console.log('--- 3. REPORTES EN TEDP_REPORTE_AVANCE ---');
  const repRes = await pool.query(
    "SELECT r.id_reporte, r.id_proyecto, r.id_equipo, e.patente, r.dia_correlativo, r.fecha_reporte, r.hora_inicio, r.hora_termino, r.horas_operadas, r.horas_facturables, r.id_user_operador, r.estado FROM sch_leangsp_prod.tedp_reporte_avance r LEFT JOIN sch_leangsp_prod.tequ_equipo e ON r.id_equipo = e.id_equipo WHERE r.id_proyecto = $1 ORDER BY r.dia_correlativo ASC, r.id_reporte ASC",
    [idProy]
  );
  console.log(JSON.stringify(repRes.rows, null, 2));

  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_ot4.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_ot4.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectOT4().catch(console.error);
