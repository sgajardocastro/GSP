const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_doc, tipo_doc, name_doc_interno, path_doc FROM sch_leangsp.tfmg_file WHERE id_doc IN (1467, 1470);'"`);
  console.log(res.stdout);

  const resRel = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, version, titulo FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 5;'"`);
  console.log('Últimos 5 Releases en sch_leangsp:\n', resRel.stdout);

  const resRelProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, version, titulo FROM sch_leangsp_prod.tcfg_releases ORDER BY id DESC LIMIT 5;'"`);
  console.log('Últimos 5 Releases en sch_leangsp_prod:\n', resRelProd.stdout);

  const resBacklog = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, codigo_req, estado FROM sch_leangsp.tcfg_backlog ORDER BY id DESC LIMIT 3;'"`);
  console.log('Últimos Backlog en sch_leangsp:\n', resBacklog.stdout);

  const resBacklogProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, codigo_req, estado FROM sch_leangsp_prod.tcfg_backlog ORDER BY id DESC LIMIT 3;'"`);
  console.log('Últimos Backlog en sch_leangsp_prod:\n', resBacklogProd.stdout);

  // Check physical file under /u05/LeanDocs
  const lsRes = await ssh.execCommand('ls -la /u05/LeanDocs/GSP/dev/contratos/2026/10/');
  console.log('Ficheros físicos en /u05/LeanDocs/GSP/dev/contratos/2026/10/:\n', lsRes.stdout);

  ssh.dispose();
}

run();
