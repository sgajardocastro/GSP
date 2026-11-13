const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function test() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- Avisos in PROD (sch_leangsp_prod.tmnt_aviso) ---');
  const qProd = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_aviso, folio_aviso, id_equipo, criticidad, descripcion, fecha_reporte, estado FROM sch_leangsp_prod.tmnt_aviso;\\""');
  console.log(qProd.stdout);

  console.log('--- Avisos in DEV (sch_leangsp.tmnt_aviso) ---');
  const qDev = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_aviso, folio_aviso, id_equipo, criticidad, descripcion, fecha_reporte, estado FROM sch_leangsp.tmnt_aviso;\\""');
  console.log(qDev.stdout);

  ssh.dispose();
}
test();
