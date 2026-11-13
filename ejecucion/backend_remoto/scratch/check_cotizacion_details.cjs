const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  console.log('=== MOVIENDO ARCHIVO 5 A PROD ===');
  await ssh.execCommand('cp -p /u05/LeanDocs/GSP/dev/cotizaciones/2026/10/GSP-2610-4851-001V1-1.pdf /u05/LeanDocs/GSP/prod/cotizaciones/2026/10/');
  await ssh.execCommand("PGPASSWORD=usr_gsp_prod_2026! psql -h localhost -U usr_leangsp_prod -d postgres -c \"UPDATE sch_leangsp_prod.tfmg_file SET path_doc = 'GSP/prod/cotizaciones/2026/10' WHERE id_doc = 5;\"");

  const check = await ssh.execCommand("PGPASSWORD=usr_gsp_prod_2026! psql -h localhost -U usr_leangsp_prod -d postgres -c 'SELECT id_doc, tipo_doc, name_doc_orig, path_doc FROM sch_leangsp_prod.tfmg_file WHERE id_doc = 5;'");
  console.log(check.stdout);

  ssh.dispose();
}

run().catch(console.error);
