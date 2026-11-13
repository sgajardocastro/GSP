const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function verify() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('--- 1. AUDITORÍA DE REPORTS EN DEV (sch_leangsp) ---');
  const devAudit = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) as total, count(*) FILTER (WHERE id_doc_pdf IS NOT NULL) as con_pdf, count(*) FILTER (WHERE id_doc_pdf IS NULL) as sin_pdf FROM sch_leangsp.tedp_reporte_avance;\\""`);
  console.log('DEV [Total | Con PDF | Sin PDF]:', devAudit.stdout.trim());

  console.log('\n--- 2. AUDITORÍA DE REPORTS EN PROD (sch_leangsp_prod) ---');
  const prodAudit = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) as total, count(*) FILTER (WHERE id_doc_pdf IS NOT NULL) as con_pdf, count(*) FILTER (WHERE id_doc_pdf IS NULL) as sin_pdf FROM sch_leangsp_prod.tedp_reporte_avance;\\""`);
  console.log('PROD [Total | Con PDF | Sin PDF]:', prodAudit.stdout.trim());

  // Obtener reportes en PROD
  console.log('\n--- 3. REPORTES RECIENTES EN PRODUCCIÓN (sch_leangsp_prod) ---');
  const recProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_reporte_avance, id_proyecto, dia_correlativo, fecha_reporte, estado_reporte, id_doc_pdf FROM sch_leangsp_prod.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 5;\\""`);
  console.log(recProd.stdout);

  // Obtener el ID del reporte más reciente de PROD
  const idProdCmd = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT id_reporte_avance FROM sch_leangsp_prod.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 1;\\""`);
  const lastProdId = idProdCmd.stdout.trim();
  
  if (lastProdId) {
    console.log(`--- 4. PROBANDO STREAMING / AUTO-REPARACIÓN EN PROD PARA REPORTE ${lastProdId} ---`);
    const curlProd = await ssh.execCommand(`curl -s -I "http://127.0.0.1:3016/api/operaciones/report/${lastProdId}/pdf"`);
    console.log(curlProd.stdout);
  }

  // Obtener el ID del reporte más reciente de DEV
  const idDevCmd = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT id_reporte_avance FROM sch_leangsp.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 1;\\""`);
  const lastDevId = idDevCmd.stdout.trim();
  
  if (lastDevId) {
    console.log(`--- 5. PROBANDO STREAMING / AUTO-REPARACIÓN EN DEV PARA REPORTE ${lastDevId} ---`);
    const curlDev = await ssh.execCommand(`curl -s -I "http://127.0.0.1:3006/api/operaciones/report/${lastDevId}/pdf"`);
    console.log(curlDev.stdout);
  }

  ssh.dispose();
}

verify().catch(e => {
  console.error('Error:', e);
  if (ssh) ssh.dispose();
  process.exit(1);
});
