const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkBacklog() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const resSchema = await ssh.execCommand(`su - postgres -c "psql -d postgres -c '\\d sch_leangsp.tcfg_backlog'"` );
  console.log('Schema:\n', resSchema.stdout);

  const resRows = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, codigo_req, nombre_requerimiento, estado FROM sch_leangsp.tcfg_backlog ORDER BY id DESC LIMIT 5;'"` );
  console.log('Rows:\n', resRows.stdout);

  ssh.dispose();
}

checkBacklog().catch(console.error);
