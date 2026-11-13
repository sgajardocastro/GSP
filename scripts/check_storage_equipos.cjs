const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICANDO CONTENIDO EN /u05/LeanDocs/GSP/equipos ===');
  const ls1 = await ssh.execCommand('ls -la /u05/LeanDocs/GSP/equipos | head -n 15');
  console.log('Archivos en /u05/LeanDocs/GSP/equipos:\n', ls1.stdout);

  const countFiles = await ssh.execCommand('ls -1 /u05/LeanDocs/GSP/equipos | wc -l');
  console.log('Total archivos en /u05/LeanDocs/GSP/equipos:', countFiles.stdout.trim());

  // Verificar si existe el archivo de ejemplo 0033a4b9-2d0c-4112-acdc-ddad4b9b069f.pdf
  const checkOne = await ssh.execCommand('ls -lh /u05/LeanDocs/GSP/equipos/0033a4b9-2d0c-4112-acdc-ddad4b9b069f.pdf');
  console.log('Check archivo 0033a4b9...:\n', checkOne.stdout || checkOne.stderr);

  ssh.dispose();
}

check().catch(console.error);
