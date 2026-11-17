const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const rCols = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tpry_linea_servicio' ORDER BY ordinal_position;"`);
  console.log('COLS tpry_linea_servicio:\n', rCols.stdout);

  ssh.dispose();
}

run().catch(console.error);
