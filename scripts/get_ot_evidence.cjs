const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const resPry = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_proyecto_estado, p.json_field->'crm_v1'->>'obra_nombre' as obra FROM sch_leangsp.tpry_proyecto p WHERE p.id_proyecto = 111;\\""`);
  console.log('DATOS_PROYECTO_111:\n', resPry.stdout.trim());

  const resRep = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_reporte_avance, id_proyecto, fecha_reporte, horas_operadas, horas_standby_cliente, horas_standby_gsp, motivo_standby, observacion_trabajo FROM sch_leangsp.tedp_reporte_avance WHERE id_reporte_avance = 37;\\""`);
  console.log('\nDATOS_REPORTE_37:\n', resRep.stdout.trim());

  const resViaje = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_desplazamiento, token_viaje, id_proyecto, tipo_trayecto, estado_viaje, combustible_salida, combustible_llegada FROM sch_leangsp.tlog_desplazamiento WHERE id_proyecto = 111 ORDER BY id_desplazamiento DESC LIMIT 1;\\""`);
  console.log('\nDATOS_VIAJE_111:\n', resViaje.stdout.trim());

  ssh.dispose();
}

run();
