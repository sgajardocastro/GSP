const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICANDO TIPOS DE CERTIFICADO EN DEV ===');
  const rTipos = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT * FROM sch_leangsp.tequ_tipos_certificado;'\"");
  console.log(rTipos.stdout);

  console.log('=== VERIFICANDO TFMG_FILE ASOCIADOS A CERTIFICADOS DE EQUIPO ===');
  const rFiles = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT f.id_doc, f.name_doc_orig, f.path_doc, f.mimetype FROM sch_leangsp.tequ_certificados_equipo ce JOIN sch_leangsp.tfmg_file f ON ce.id_doc = f.id_doc LIMIT 5;'\"");
  console.log(rFiles.stdout);

  const rCountFiles = await ssh.execCommand("su - postgres -c \"psql -d postgres -t -c 'SELECT count(DISTINCT ce.id_doc) FROM sch_leangsp.tequ_certificados_equipo ce WHERE ce.id_doc IS NOT NULL;'\"");
  console.log('Total id_doc distintos en certificados_equipo:', rCountFiles.stdout.trim());

  // Verificar si existen en tfmg_file de prod
  const rProdFilesMatch = await ssh.execCommand("su - postgres -c \"psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp_prod.tfmg_file WHERE id_doc IN (SELECT DISTINCT ce.id_doc FROM sch_leangsp.tequ_certificados_equipo ce WHERE ce.id_doc IS NOT NULL);'\"");
  console.log('Cuántos de esos id_doc ya están en sch_leangsp_prod.tfmg_file:', rProdFilesMatch.stdout.trim());

  ssh.dispose();
}

check().catch(console.error);
