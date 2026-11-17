const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkFile2015() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_doc, name_file, path_file FROM sch_leangsp_prod.tfmg_file WHERE id_doc = 2015;\\""');
  console.log('FILE 2015:', res.stdout);

  const res2 = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_rel_persona, id_proyecto, id_user, rol_persona FROM sch_leangsp_prod.tpry_rel_persona WHERE id_proyecto = 101;\\""');
  console.log('REL_PERSONA 101:', res2.stdout);

  ssh.dispose();
}

checkFile2015().catch(console.error);
