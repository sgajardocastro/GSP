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

  const r = await ssh.execCommand('sudo -u postgres psql -d postgres -c "SELECT re.id_rel_equipo, re.id_proyecto, re.id_equipo, eq.patente, eq.modelo FROM sch_leangsp_prod.tpry_rel_equipo re JOIN sch_leangsp_prod.tequ_equipo eq ON re.id_equipo = eq.id_equipo WHERE re.id_proyecto = 101;"');
  console.log('REL EQUIPO 101:\n', r.stdout);

  ssh.dispose();
}

run().catch(console.error);
