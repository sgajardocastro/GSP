const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 10000
  });

  const runSql = async (sql) => {
    const escapedSql = sql.replace(/"/g, '\\"');
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"${escapedSql}\\""`);
    if (res.stderr) console.error('STDERR:', res.stderr);
    return res.stdout.trim();
  };

  console.log('=== TABLAS CON id_proyecto = 3 EN sch_leangsp_prod ===');

  // 1. tequ_log_desplazamiento
  const v = await runSql("SELECT count(*), json_agg(row_to_json(t)) FROM (SELECT id_log_desplazamiento, tipo_trayecto, estado_trayecto, foto_tablero_salida_path, foto_odometro_salida_path, foto_horometro_salida_path, foto_tablero_llegada_path, foto_odometro_llegada_path, foto_horometro_camion_llegada_path, foto_horometro_grua_llegada_path FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_proyecto = 3) t;");
  console.log('VIAJES:', v);

  // 2. tequ_log_desplazamiento_costo
  const vc = await runSql("SELECT count(*), json_agg(row_to_json(t)) FROM (SELECT * FROM sch_leangsp_prod.tequ_log_desplazamiento_costo WHERE id_log_desplazamiento IN (SELECT id_log_desplazamiento FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_proyecto = 3)) t;");
  console.log('COSTOS / VOUCHERS COPEC:', vc);

  // 3. tedp_reporte_avance
  const ra = await runSql("SELECT count(*), json_agg(row_to_json(t)) FROM (SELECT id_reporte_avance, dia_correlativo, fecha_reporte, estado_reporte, id_doc_pdf, foto_tablero_inicio, foto_tablero_termino, foto_voucher_cliente, obs_validador FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 3) t;");
  console.log('REPORTS DE AVANCE:', ra);

  // 4. tits_transicion_historial
  const th = await runSql("SELECT count(*), json_agg(row_to_json(t)) FROM (SELECT * FROM sch_leangsp_prod.tits_transicion_historial WHERE id_proyecto = 3) t;");
  console.log('ITS TRANSICIONES / PLANILLAS:', th);

  // 5. tedp_estado_pago
  const edp = await runSql("SELECT count(*), json_agg(row_to_json(t)) FROM (SELECT * FROM sch_leangsp_prod.tedp_estado_pago WHERE id_proyecto = 3) t;");
  console.log('ESTADOS DE PAGO (EDP):', edp);

  // 6. tsrv_survey_ticket
  const srv = await runSql("SELECT count(*), json_agg(row_to_json(t)) FROM (SELECT id_survey, id_template, id_doc, estado, fecha_creacion FROM sch_leangsp_prod.tsrv_survey_ticket WHERE id_proyecto = 3) t;");
  console.log('SURVEY TICKETS (VISITAS / CHECKS):', srv);

  // 7. tfmg_file
  const fmg = await runSql("SELECT count(*), json_agg(row_to_json(t)) FROM (SELECT id_doc, name_doc_orig, path_doc, tipo_doc, fecha_creacion FROM sch_leangsp_prod.tfmg_file WHERE path_doc LIKE '%766-003%' OR name_doc_orig LIKE '%766-003%' OR path_doc LIKE '%/3/%') t;");
  console.log('TFMG FILES (POR PATH O NOMBRE):', fmg);

  // 8. tdoc_archivos o tpar_documentos
  const doc = await runSql("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND (table_name LIKE '%doc%' OR table_name LIKE '%file%' OR table_name LIKE '%adjunto%');");
  console.log('TABLAS DOCUMENTALES EN PROD:', doc);

  ssh.dispose();
}

run().catch(console.error);
