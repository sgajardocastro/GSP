const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function runMigration() {
  console.log('🚀 Conectando a servidor.leanglobal.cl:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  console.log('✅ SSH Conectado.');

  const ddlSql = `
    ALTER TABLE sch_leangsp_prod.tedp_reporte_avance 
      ADD COLUMN IF NOT EXISTS fecha_firma_fes TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS codigo_validacion_fes VARCHAR(100),
      ADD COLUMN IF NOT EXISTS id_doc_pdf BIGINT,
      ADD COLUMN IF NOT EXISTS ajustes_analista JSONB;

    ALTER TABLE sch_leangsp_prod.tits_jornada_detalle 
      ADD COLUMN IF NOT EXISTS tarifa_hora NUMERIC(12, 2),
      ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2);
  `;

  console.log('📦 Ejecutando ALTER TABLE en sch_leangsp_prod...');
  const resDdl = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${ddlSql.replace(/\n/g, ' ')}"`);
  console.log('Resultado DDL:\n', resDdl.stdout);
  if (resDdl.stderr) {
    console.error('Stderr DDL:\n', resDdl.stderr);
  }

  console.log('🔍 Verificando columnas en sch_leangsp_prod.tedp_reporte_avance...');
  const checkColsSql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance'
      AND column_name IN ('fecha_firma_fes', 'codigo_validacion_fes', 'id_doc_pdf', 'ajustes_analista');
  `;
  const resCheck = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${checkColsSql.replace(/\n/g, ' ')}"`);
  console.log(resCheck.stdout);

  console.log('🧪 Probando endpoint PROD /operaciones/report/pendientes-analista...');
  const resCurl = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/operaciones/report/pendientes-analista');
  try {
    const json = JSON.parse(resCurl.stdout);
    console.log('✅ Endpoint respondió JSON válido!');
    console.log('Success:', json.success);
    console.log('KPIs:', json.data?.kpis);
    console.log('Cantidad reports:', json.data?.reports?.length);
    if (json.data?.reports?.length > 0) {
      console.log('Primer report:', {
        id_reporte_avance: json.data.reports[0].id_reporte_avance,
        codi_proyecto: json.data.reports[0].codi_proyecto,
        estado_reporte: json.data.reports[0].estado_reporte,
        cliente_nombre: json.data.reports[0].cliente_nombre,
        operador_nombre: json.data.reports[0].operador_nombre,
        fecha_reporte: json.data.reports[0].fecha_reporte
      });
    }
    console.log('Cantidad OTs liquidación:', json.data?.ots_liquidacion?.length);
    if (json.data?.ots_liquidacion?.length > 0) {
      console.log('Primer OT liquidación:', {
        id_proyecto: json.data.ots_liquidacion[0].id_proyecto,
        codi_proyecto: json.data.ots_liquidacion[0].codi_proyecto,
        cliente_nombre: json.data.ots_liquidacion[0].cliente_nombre,
        estado_its: json.data.ots_liquidacion[0].estado_its,
        total_reports: json.data.ots_liquidacion[0].total_reports
      });
    }
  } catch (e) {
    console.error('❌ Error al parsear respuesta:', resCurl.stdout);
  }

  ssh.dispose();
}

runMigration().catch(console.error);
