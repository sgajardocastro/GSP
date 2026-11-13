const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. Estructura de tits_transicion_historial ===');
  const ddlRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tits_transicion_historial' ORDER BY ordinal_position;\\""`);
  console.log(ddlRes.stdout.trim().split('\n').map(s => s.trim()).filter(Boolean).join(', '));

  console.log('=== 2. Clonando registros de DEV a PROD que falten en PROD ===');
  const syncSql = `
    INSERT INTO sch_leangsp_prod.tits_transicion_historial (
      folio_its, numero_cotizacion, version, cliente_nombre, cliente_rut, empresa_facturacion,
      ejecutivo_comercial, ciudad_obra, fecha_inicio, fecha_termino, total_venta, total_costos,
      utilidad_bruta, margen, estado, id_doc, data_json, firmas_fes, historial_observaciones,
      id_usuario_elaborador, id_usuario_verificador, id_usuario_aprobador
    )
    SELECT 
      d.folio_its, d.numero_cotizacion, d.version, d.cliente_nombre, d.cliente_rut, d.empresa_facturacion,
      d.ejecutivo_comercial, d.ciudad_obra, d.fecha_inicio, d.fecha_termino, d.total_venta, d.total_costos,
      d.utilidad_bruta, d.margen, d.estado,
      CASE WHEN EXISTS (SELECT 1 FROM sch_leangsp_prod.tfmg_file f WHERE f.id_doc = d.id_doc) THEN d.id_doc ELSE NULL END,
      d.data_json, d.firmas_fes, d.historial_observaciones,
      CASE WHEN EXISTS (SELECT 1 FROM sch_leangsp_prod.tsec_users u WHERE u.id_user = d.id_usuario_elaborador) THEN d.id_usuario_elaborador ELSE NULL END,
      CASE WHEN EXISTS (SELECT 1 FROM sch_leangsp_prod.tsec_users u WHERE u.id_user = d.id_usuario_verificador) THEN d.id_usuario_verificador ELSE NULL END,
      CASE WHEN EXISTS (SELECT 1 FROM sch_leangsp_prod.tsec_users u WHERE u.id_user = d.id_usuario_aprobador) THEN d.id_usuario_aprobador ELSE NULL END
    FROM sch_leangsp.tits_transicion_historial d
    WHERE NOT EXISTS (
      SELECT 1 FROM sch_leangsp_prod.tits_transicion_historial p 
      WHERE p.numero_cotizacion = d.numero_cotizacion
    );
  `;
  const syncRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${syncSql.replace(/"/g, '\\"')}\\""`);
  console.log('Resultado de inserción:', syncRes.stdout.trim() || syncRes.stderr);

  console.log('\n=== 3. Conteo Final en PROD ===');
  const countProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_transicion, folio_its, numero_cotizacion, cliente_nombre, estado, total_venta, total_costos FROM sch_leangsp_prod.tits_transicion_historial ORDER BY id_transicion;'"`);
  console.log(countProd.stdout);

  ssh.dispose();
}

run().catch(console.error);
