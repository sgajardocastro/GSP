const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const sqlIts = `SELECT id_its, id_proyecto, folio_its, estado_its, fecha_elaborado, fecha_aprobado, fecha_recibido FROM sch_leangsp_prod.tits_informe_termino;`;
  const resIts = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlIts}\\""`);
  console.log('ALL ITS PROD:\n', resIts.stdout);

  ssh.dispose();
}

run().catch(console.error);
