const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `su - postgres -c "psql -d postgres -c \\"
    SELECT id_reporte_avance, fecha_reporte, fecha_inicio_servicio, fecha_termino_servicio, horas_operadas, horas_facturables, horas_colacion, ajustes_analista
    FROM sch_leangsp_prod.tedp_reporte_avance
    WHERE id_proyecto = 30;
  \\""`;
  const res = await ssh.execCommand(cmd);
  console.log('REPORTE DE PROYECTO 30:');
  console.log('STDOUT:', res.stdout);

  ssh.dispose();
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
