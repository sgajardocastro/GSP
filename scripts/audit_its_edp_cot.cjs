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

  console.log('=== COMPARATIVA DE TODOS LOS ITS EN PRODUCCION ===');
  const q = `
    SELECT 
      its.id_its,
      p.id_proyecto,
      p.codi_proyecto,
      p.nombre_proyecto,
      its.folio_its,
      its.estado_its,
      ROUND(COALESCE(cot.total_cot, 0)::numeric, 0) as total_cotizacion,
      ROUND(COALESCE(edp.neto_edp, 0)::numeric, 0) as neto_edp,
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
      SELECT id_proyecto, SUM(COALESCE(monto_neto, 0)) as neto_edp
      FROM sch_leangsp_prod.tedp_estado_pago
      GROUP BY id_proyecto
    ) edp ON p.id_proyecto = edp.id_proyecto
    ORDER BY its.id_its ASC;
  `;
  const r = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${q.replace(/\n/g, ' ')}"`);
  console.log(r.stdout);
  if (r.stderr) console.error('STDERR:', r.stderr);

  ssh.dispose();
}

run().catch(console.error);
