const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- NGINX BASE.CONF LINES 520-560 ---');
  const lines = await ssh.execCommand('sed -n "520,560p" /etc/nginx/default.d/base.conf');
  console.log(lines.stdout);

  console.log('--- ARCHIVO 1434 EN tfmg_file DE PROD VS DEV ---');
  const qProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_file, tipo_doc, name_doc_orig, name_doc_interno, path_doc FROM sch_leangsp_prod.tfmg_file WHERE id_file = 1434;\\""`);
  console.log('PROD tfmg_file:\n', qProd.stdout);

  const qDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_file, tipo_doc, name_doc_orig, name_doc_interno, path_doc FROM sch_leangsp.tfmg_file WHERE id_file = 1434;\\""`);
  console.log('DEV tfmg_file:\n', qDev.stdout);

  ssh.dispose();
}

run();
