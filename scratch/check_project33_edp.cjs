const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  await ssh.execCommand('cat << \'EOF\' > /tmp/query33.sql\nSELECT id_proyecto, codi_proyecto, nombre_proyecto, json_field->\'crm_v1\'->\'lineas_operativas_vigentes\' as lineas FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 33;\nEOF');
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query33.sql"');
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  ssh.dispose();
}

run().catch(console.error);
