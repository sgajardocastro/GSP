const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado, adjuntos FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req IN (\'REQ-1127\', \'REQ-1128\', \'REQ-1129\', \'REQ-1131\') ORDER BY codigo_req;\\""');
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
