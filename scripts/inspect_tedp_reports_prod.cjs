const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== COLUMNAS tedp_reporte_avance ===');
  const resCols = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance';
  \\""`);
  console.log(resCols.stdout);

  console.log('=== FILAS DE tedp_reporte_avance id_proyecto = 4 ===');
  const resRows = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT * FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 4;
  \\""`);
  console.log(resRows.stdout);

  console.log('=== FILAS DE tits_informe_termino id_proyecto = 4 ===');
  const resIts = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT * FROM sch_leangsp_prod.tits_informe_termino WHERE id_proyecto = 4;
  \\""`);
  console.log(resIts.stdout);

  console.log('=== FILAS DE tedp_estado_pago id_proyecto = 4 ===');
  const resEdp = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT * FROM sch_leangsp_prod.tedp_estado_pago WHERE id_proyecto = 4;
  \\""`);
  console.log(resEdp.stdout);

  ssh.dispose();
}

run().catch(e => { console.error(e); if (ssh) ssh.dispose(); });
