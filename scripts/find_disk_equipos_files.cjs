const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== BUSCANDO ARCHIVOS DE EQUIPOS EN DISCO ===');
  const find1 = await ssh.execCommand('find /u05/LeanDocs -name "*Permiso 30-09-2026*" 2>/dev/null');
  console.log('Find en /u05/LeanDocs:\n', find1.stdout);

  const find2 = await ssh.execCommand('find /u05 -name "*equipos*" 2>/dev/null | head -n 20');
  console.log('Find equipos en /u05:\n', find2.stdout);

  const find3 = await ssh.execCommand('find /var/www -name "*equipos*" 2>/dev/null | head -n 20');
  console.log('Find equipos en /var/www:\n', find3.stdout);

  // Ver cómo tfmgArchivoController / archivoController resuelve el archivo
  const sampleDoc = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT * FROM sch_leangsp.tfmg_file WHERE id_doc = 499;'\"");
  console.log('Sample doc 499 in sch_leangsp.tfmg_file:\n', sampleDoc.stdout);

  ssh.dispose();
}

check().catch(console.error);
