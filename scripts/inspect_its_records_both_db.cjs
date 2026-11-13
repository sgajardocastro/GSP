const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('--- BACKLOG PROD ---');
  const resBkl = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req = 'REQ-1058';\\""`);
  console.log(resBkl.stdout || resBkl.stderr);

  console.log('--- BACKLOG DEV ---');
  const resBklDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp.tcfg_backlog WHERE codigo_req = 'REQ-1058';\\""`);
  console.log(resBklDev.stdout || resBklDev.stderr);

  ssh.dispose();
}

run().catch(console.error);
