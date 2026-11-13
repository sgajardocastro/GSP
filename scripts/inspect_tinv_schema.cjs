const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectSchema() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const query = `
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp' AND table_name IN ('tinv_conteo', 'tinv_conteo_linea') 
    ORDER BY table_name, ordinal_position;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${query.replace(/\n/g, ' ')}\\""`);
  console.log('Columnas tinv_movimiento:\n', res.stdout);

  ssh.dispose();
}

inspectSchema().catch(console.error);
