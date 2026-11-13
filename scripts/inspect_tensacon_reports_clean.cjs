const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectReports() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT id_reporte_avance, fecha_reporte, horas_operadas, horas_minimas, horas_facturables, 
           horas_sobretiempo, monto_devengado_dia, observacion_trabajo, estado_reporte
    FROM sch_leangsp_prod.tedp_reporte_avance 
    WHERE id_proyecto = 4 ORDER BY fecha_reporte;
  \\""`);
  console.log('--- REPORTS DETALLE ---');
  console.log(res.stdout);

  ssh.dispose();
}

inspectReports().catch(console.error);
