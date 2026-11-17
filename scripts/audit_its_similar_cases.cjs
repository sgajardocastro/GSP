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

  // Query 1: Column names of tpry_proyecto & tits_informe_termino
  const rCols = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tpry_proyecto' ORDER BY ordinal_position;"`);
  console.log('COLS tpry_proyecto:\n', rCols.stdout);

  // Query 2: All ITS records
  const rIts = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "SELECT id_its, id_proyecto, folio_its, es_valor_fijo, valor_fijo_pactado, valor_hora_pactado, valor_flete_pactado, total_ingresos_facturables, estado FROM sch_leangsp_prod.tits_informe_termino ORDER BY id_its DESC;"`);
  console.log('ALL ITS RECORDS:\n', rIts.stdout);
  if (rIts.stderr) console.error('ITS STDERR:', rIts.stderr);

  // Query 3: Service lines distribution per project
  const qLines = `
    SELECT 
      p.id_proyecto, 
      p.codi_proyecto, 
      p.nombre_proyecto,
      COUNT(ls.id_linea_servicio) as total_lineas,
      COUNT(CASE WHEN UPPER(COALESCE(ls.unidad, '')) LIKE '%HORA%' THEN 1 END) as cant_horas,
      COUNT(CASE WHEN UPPER(COALESCE(ls.unidad, '')) LIKE '%FIJO%' OR UPPER(COALESCE(ls.descripcion, '')) LIKE '%RIGGER%' THEN 1 END) as cant_fijo_rigger,
      COUNT(CASE WHEN UPPER(COALESCE(ls.descripcion, '')) LIKE '%TRASLADO%' OR UPPER(COALESCE(ls.unidad, '')) LIKE '%VIAJE%' THEN 1 END) as cant_fletes
    FROM sch_leangsp_prod.tpry_proyecto p
    JOIN sch_leangsp_prod.tpry_linea_servicio ls ON p.id_proyecto = ls.id_proyecto
    GROUP BY p.id_proyecto, p.codi_proyecto, p.nombre_proyecto
    HAVING COUNT(CASE WHEN UPPER(COALESCE(ls.unidad, '')) LIKE '%HORA%' THEN 1 END) > 0
       AND COUNT(CASE WHEN UPPER(COALESCE(ls.unidad, '')) LIKE '%FIJO%' OR UPPER(COALESCE(ls.descripcion, '')) LIKE '%RIGGER%' THEN 1 END) > 0
    ORDER BY p.id_proyecto DESC;
  `;
  const rLines = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${qLines.replace(/\n/g, ' ')}"`);
  console.log('PROJECTS WITH HYBRID LINES (HORA + FIJO/RIGGER):\n', rLines.stdout);
  if (rLines.stderr) console.error('LINES STDERR:', rLines.stderr);

  ssh.dispose();
}

run().catch(console.error);
