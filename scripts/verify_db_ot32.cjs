const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT j.id_jornada, j.id_its, j.fecha, j.tipo_servicio, j.tarifa_hora, j.subtotal, j.numero_report FROM sch_leangsp_prod.tits_jornada_detalle j JOIN sch_leangsp_prod.tits_informe_termino i ON i.id_its = j.id_its WHERE i.id_proyecto = 32;'"`);
  console.log('BD PROD Jornadas OT 32:\n', res.stdout);

  ssh.dispose();
}

main().catch(console.error);
