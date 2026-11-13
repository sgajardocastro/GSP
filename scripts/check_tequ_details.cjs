const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `su - postgres -c "psql -d postgres -c \\"SELECT jd.id_jornada, jd.id_its, jd.fecha, jd.id_equipo, jd.patente, jd.tipo_servicio, jd.hora_salida, jd.hora_llegada, jd.hora_termino, jd.hora_retorno, jd.horas_report, jd.numero_report FROM sch_leangsp.tits_jornada_detalle jd JOIN sch_leangsp.tits_informe_termino its ON jd.id_its = its.id_its WHERE its.id_proyecto = 32;\\""`;
  const res = await ssh.execCommand(cmd);
  console.log('DEV:', res.stdout);

  ssh.dispose();
}

run().catch(console.error);
