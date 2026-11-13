const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, nombre_proyecto, json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 35;\\""`;
  const res = await ssh.execCommand(cmd);
  console.log('STDOUT:', res.stdout);
  console.log('STDERR:', res.stderr);

  const cmdRep = `su - postgres -c "psql -d postgres -c \\"SELECT id_reporte_avance, id_equipo, id_user_operador, id_user_rigger, fecha_reporte, horas_colacion, horas_operadas, horas_facturables, ajustes_analista FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 35 ORDER BY id_reporte_avance;\\""`;
  const resRep = await ssh.execCommand(cmdRep);
  console.log('REP STDOUT:', resRep.stdout);
  console.log('REP STDERR:', resRep.stderr);

  ssh.dispose();
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
