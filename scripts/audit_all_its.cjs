const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. ANALISIS DE LOS 8 ITS EXISTENTES EN PRODUCCION ===');
  const qItsComparison = `
    SELECT 
      its.id_its,
      p.id_proyecto,
      p.codi_proyecto,
      p.nombre_proyecto,
      its.folio_its,
      its.estado_its,
      ROUND(COALESCE(cot.total_cot, 0)::numeric, 0) as total_cotizacion,
      ROUND(COALESCE(edp.monto_edp, 0)::numeric, 0) as total_edp,
      ROUND(COALESCE(its.total_ingresos_facturables, 0)::numeric, 0) as total_its,
      ROUND((COALESCE(cot.total_cot, 0) - COALESCE(its.total_ingresos_facturables, 0))::numeric, 0) as dif_cot_vs_its
    FROM sch_leangsp_prod.tits_informe_termino its
    JOIN sch_leangsp_prod.tpry_proyecto p ON its.id_proyecto = p.id_proyecto
    LEFT JOIN (
      SELECT id_proyecto, SUM(COALESCE(subtotal, 0)) as total_cot
      FROM sch_leangsp_prod.tpry_linea_servicio
      WHERE activo IS NOT FALSE
      GROUP BY id_proyecto
    ) cot ON p.id_proyecto = cot.id_proyecto
    LEFT JOIN (
      SELECT id_proyecto, SUM(COALESCE(monto_total, subtotal, 0)) as monto_edp
      FROM sch_leangsp_prod.tedp_estado_pago
      GROUP BY id_proyecto
    ) edp ON p.id_proyecto = edp.id_proyecto
    ORDER BY its.id_its ASC;
  `;
  const rItsComp = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${qItsComparison.replace(/\n/g, ' ')}"`);
  console.log(rItsComp.stdout);

  console.log('=== 2. LINEAS DE SERVICIO DE LOS PROYECTOS CON DIFERENCIAS O CASOS MIXTOS ===');
  const qLines = `
    SELECT 
      ls.id_proyecto,
      p.codi_proyecto,
      ls.id_linea_servicio,
      ls.descripcion,
      ls.unidad,
      ls.cantidad,
      ls.valor_unitario,
      ls.subtotal
    FROM sch_leangsp_prod.tpry_linea_servicio ls
    JOIN sch_leangsp_prod.tpry_proyecto p ON ls.id_proyecto = p.id_proyecto
    WHERE ls.id_proyecto IN (30, 32, 34, 44, 74, 75, 77, 86, 92, 107)
    ORDER BY ls.id_proyecto, ls.id_linea_servicio;
  `;
  const rLines = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${qLines.replace(/\n/g, ' ')}"`);
  console.log(rLines.stdout);

  console.log('=== 3. PROYECTOS EN CURSO O PREVENTA CON COMBINACIONES MIXTAS (HORA + RIGGER / VALOR FIJO) QUE AUN NO TIENEN ITS ===');
  const qPending = `
    SELECT 
      p.id_proyecto,
      p.codi_proyecto,
      p.nombre_proyecto,
      p.id_proyecto_estado,
      COUNT(ls.id_linea_servicio) as total_lineas,
      STRING_AGG(DISTINCT ls.unidad, ', ') as unidades_presentes,
      SUM(ls.subtotal) as total_cotizado
    FROM sch_leangsp_prod.tpry_proyecto p
    JOIN sch_leangsp_prod.tpry_linea_servicio ls ON p.id_proyecto = ls.id_proyecto
    WHERE ls.activo IS NOT FALSE
    GROUP BY p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_proyecto_estado
    HAVING COUNT(CASE WHEN UPPER(COALESCE(ls.unidad, '')) LIKE '%HORA%' THEN 1 END) > 0
       AND COUNT(CASE WHEN UPPER(COALESCE(ls.unidad, '')) LIKE '%FIJO%' OR UPPER(COALESCE(ls.descripcion, '')) LIKE '%RIGGER%' THEN 1 END) > 0
    ORDER BY p.id_proyecto DESC;
  `;
  const rPending = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${qPending.replace(/\n/g, ' ')}"`);
  console.log(rPending.stdout);

  ssh.dispose();
}

run().catch(console.error);
