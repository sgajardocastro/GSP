const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_reporte_avance, id_proyecto, horas_operadas, horas_standby_cliente, horas_standby_gsp, motivo_standby FROM sch_leangsp.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 1;\\""`);
  console.log('ULTIMO_REPORTE:', res.stdout.trim());
  const reportId = res.stdout.trim().split('|')[0] || 1;

  const pdfCmd = `su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node -e '
    require(\\"dotenv\\").config();
    const { generarPdfReportDiario } = require(\\"./src/services/reportDiarioPdfService\\");
    const db = require(\\"./src/config/postgresPool\\");

    (async () => {
      try {
        const { rows } = await db.query(\\"SELECT * FROM sch_leangsp.tedp_reporte_avance WHERE id_reporte_avance = ${reportId}\\");
        if (rows.length === 0) { console.log(\\"NO_ROW\\"); return; }
        const rep = rows[0];
        rep.id_reporte = rep.id_reporte_avance;
        const buf = await generarPdfReportDiario({
          report: rep,
          proyecto: { codi_proyecto: \\"OT-111\\", nombre_proyecto: \\"Proyecto Prueba QA\\" },
          validador: { nombre: \\"Lean GSP Admin\\", rut: \\"1-9\\" }
        });
        console.log(\\"PDF_SUCCESS:\\" + buf.length + \\":\\" + buf.slice(0, 5).toString());
      } catch (err) {
        console.error(\\"PDF_ERROR:\\", err.message);
      }
    })();
  '"`;

  const pdfRes = await ssh.execCommand(pdfCmd);
  console.log('PDF_RES:\n', pdfRes.stdout.trim());
  if (pdfRes.stderr) console.error('PDF_ERR:\n', pdfRes.stderr.trim());

  ssh.dispose();
}

run().catch(console.error);
