const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_doc, tipo_doc, name_doc_orig, name_doc_interno, path_doc FROM sch_leangsp.tfmg_file WHERE id_doc = 1467;\\""`);
  console.log(res.stdout || res.stderr);

  const findFile = await ssh.execCommand('find / -name "CTR-2026-0109.pdf" 2>/dev/null');
  console.log('Ubicación física en servidor de CTR-2026-0109.pdf:\n', findFile.stdout);

  ssh.dispose();
}

run();
