const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function auditProdContamination() {
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
  console.log('=== AUDITORIA 1: DIAS DUPLICADOS EN TEDP_REPORTE_AVANCE ===');
  const dupes = await pool.query(\`
    SELECT id_proyecto, dia_correlativo, COUNT(*) as total_reportes, array_agg(id_reporte_avance) as ids_reportes, array_agg(id_equipo) as ids_equipos
    FROM sch_leangsp_prod.tedp_reporte_avance
    WHERE estado_reporte != 'ANULADO'
    GROUP BY id_proyecto, dia_correlativo
    HAVING COUNT(*) > 1
    ORDER BY id_proyecto, dia_correlativo
  \`);
  console.log('Dias duplicados encontrados:', dupes.rows);

  console.log('\\n=== AUDITORIA 2: REPORTES CON EQUIPOS QUE NO COINCIDEN CON TPRY_REL_EQUIPO VIGENTE A ESA FECHA ===');
  const discrepancias = await pool.query(\`
    SELECT 
      p.id_proyecto,
      p.codi_proyecto,
      p.nombre_proyecto,
      r.id_reporte_avance,
      r.dia_correlativo,
      r.fecha_reporte,
      r.id_equipo as id_equipo_reporte,
      e_rep.patente as patente_reporte,
      re.id_equipo as id_equipo_programado,
      e_prog.patente as patente_programada,
      re.fecha_plan_ini,
      re.fecha_plan_fin
    FROM sch_leangsp_prod.tedp_reporte_avance r
    JOIN sch_leangsp_prod.tpry_proyecto p ON r.id_proyecto = p.id_proyecto
    LEFT JOIN sch_leangsp_prod.tequ_equipo e_rep ON r.id_equipo = e_rep.id_equipo
    LEFT JOIN sch_leangsp_prod.tpry_rel_equipo re ON re.id_proyecto = r.id_proyecto 
      AND re.estado_real = 'PROGRAMADO'
      AND r.fecha_reporte::date >= re.fecha_plan_ini::date
      AND r.fecha_reporte::date <= re.fecha_plan_fin::date
    LEFT JOIN sch_leangsp_prod.tequ_equipo e_prog ON re.id_equipo = e_prog.id_equipo
    WHERE r.estado_reporte != 'ANULADO'
      AND re.id_equipo IS NOT NULL
      AND r.id_equipo != re.id_equipo
    ORDER BY p.id_proyecto, r.dia_correlativo
  \`);
  console.log('Reportes con discrepancia de flota programada vs reportada:', discrepancias.rows);

  console.log('\\n=== AUDITORIA 3: PROYECTOS DONDE EL JSON DIFIERE DE TPRY_REL_EQUIPO ACTIVO ===');
  const jsonMismatches = await pool.query(\`
    SELECT 
      p.id_proyecto,
      p.codi_proyecto,
      p.nombre_proyecto,
      p.id_proyecto_estado,
      p.json_field->'crm_v1'->'lineas_servicio'->0->>'equipo_asignado_id' as id_eq_json,
      re.id_equipo as id_eq_relacional,
      e_rel.patente as patente_relacional
    FROM sch_leangsp_prod.tpry_proyecto p
    JOIN sch_leangsp_prod.tpry_rel_equipo re ON p.id_proyecto = re.id_proyecto AND re.estado_real = 'PROGRAMADO'
    LEFT JOIN sch_leangsp_prod.tequ_equipo e_rel ON re.id_equipo = e_rel.id_equipo
    WHERE p.id_proyecto_estado >= 4
      AND p.json_field->'crm_v1'->'lineas_servicio'->0->>'equipo_asignado_id' IS NOT NULL
      AND (p.json_field->'crm_v1'->'lineas_servicio'->0->>'equipo_asignado_id')::int != re.id_equipo
  \`);
  console.log('Proyectos operativos con desfase JSON vs TPRY_REL_EQUIPO:', jsonMismatches.rows);

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/audit_contamination.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/audit_contamination.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

auditProdContamination().catch(console.error);
