const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('Buscando archivos...');
  const res1 = await ssh.execCommand('find /u05 -name "0033a4b9*" 2>/dev/null');
  console.log('En /u05:', res1.stdout.trim() || 'No encontrado');

  const res2 = await ssh.execCommand('find /home -name "0033a4b9*" 2>/dev/null');
  console.log('En /home:', res2.stdout.trim() || 'No encontrado');

  const res3 = await ssh.execCommand('find /var -name "0033a4b9*" 2>/dev/null');
  console.log('En /var:', res3.stdout.trim() || 'No encontrado');

  // Ahora busquemos el que sí estaba en /u05/LeanDocs/GSP/equipos: 01290874-717c-456d-bfaf-4f68f944ff8b.pdf
  const resDoc = await ssh.execCommand("su - postgres -c \"psql -d postgres -c \\\"SELECT * FROM sch_leangsp.tfmg_file WHERE name_doc_interno LIKE '01290874%';\\\"\"");
  console.log('TFMG_FILE para 01290874:\n', resDoc.stdout.trim());

  // Ver cómo tfmgArchivoController busca los archivos y sirve la URL
  ssh.dispose();
}

check().catch(console.error);
