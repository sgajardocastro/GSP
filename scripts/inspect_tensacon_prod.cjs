const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectSchema() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== TABLAS EN sch_leangsp_prod ===');
  const resTables = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' ORDER BY table_name;
  \\""`);
  console.log(resTables.stdout);

  console.log('=== COLUMNAS tpry_proyecto ===');
  const resCols = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tpry_proyecto';
  \\""`);
  console.log(resCols.stdout);

  console.log('=== REGISTRO GSP-2610-233-004 ===');
  const resRow = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT * FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto ILIKE '%233-004%';
  \\""`);
  console.log(resRow.stdout);

  ssh.dispose();
}

inspectSchema().catch(e => { console.error(e); ssh.dispose(); });
