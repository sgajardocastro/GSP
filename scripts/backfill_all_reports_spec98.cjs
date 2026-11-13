const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('======================================================================');
  console.log(' REGULARIZACIÓN / AUTO-REPARACIÓN RETROACTIVA DE REPORTS HISTÓRICOS');
  console.log('======================================================================\n');

  // 1. Regularizar PROD (puerto 3016)
  console.log('--- 1. PROCESANDO REPORTES SIN PDF EN PRODUCCIÓN (sch_leangsp_prod) ---');
  const prodIdsRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT id_reporte_avance FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_doc_pdf IS NULL ORDER BY id_reporte_avance ASC;\\""`);
  const prodIds = prodIdsRes.stdout.trim().split('\n').map(s => s.trim()).filter(Boolean);
  console.log(`Encontrados ${prodIds.length} reportes sin PDF en PROD: [${prodIds.join(', ')}]`);

  for (const id of prodIds) {
    process.stdout.write(`Reparando PROD Report #${id}... `);
    const res = await ssh.execCommand(`curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3016/api/operaciones/report/${id}/pdf"`);
    console.log(`HTTP ${res.stdout.trim()}`);
  }

  // 2. Regularizar DEV (puerto 3006)
  console.log('\n--- 2. PROCESANDO REPORTES SIN PDF EN DESARROLLO (sch_leangsp) ---');
  const devIdsRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT id_reporte_avance FROM sch_leangsp.tedp_reporte_avance WHERE id_doc_pdf IS NULL ORDER BY id_reporte_avance ASC;\\""`);
  const devIds = devIdsRes.stdout.trim().split('\n').map(s => s.trim()).filter(Boolean);
  console.log(`Encontrados ${devIds.length} reportes sin PDF en DEV: [${devIds.join(', ')}]`);

  for (const id of devIds) {
    process.stdout.write(`Reparando DEV Report #${id}... `);
    const res = await ssh.execCommand(`curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3006/api/operaciones/report/${id}/pdf"`);
    console.log(`HTTP ${res.stdout.trim()}`);
  }

  // 3. Auditoría Final de Cobertura
  console.log('\n--- 3. AUDITORÍA FINAL DE COBERTURA 100% ---');
  const prodAuditFinal = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) as total, count(*) FILTER (WHERE id_doc_pdf IS NOT NULL) as con_pdf, count(*) FILTER (WHERE id_doc_pdf IS NULL) as sin_pdf FROM sch_leangsp_prod.tedp_reporte_avance;\\""`);
  console.log('PROD Final [Total | Con PDF | Sin PDF]:', prodAuditFinal.stdout.trim());

  const devAuditFinal = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) as total, count(*) FILTER (WHERE id_doc_pdf IS NOT NULL) as con_pdf, count(*) FILTER (WHERE id_doc_pdf IS NULL) as sin_pdf FROM sch_leangsp.tedp_reporte_avance;\\""`);
  console.log('DEV Final [Total | Con PDF | Sin PDF]:', devAuditFinal.stdout.trim());

  ssh.dispose();
  console.log('\n✓ Regularización completa finalizada.');
}

run().catch(e => {
  console.error(e);
  if (ssh) ssh.dispose();
  process.exit(1);
});
