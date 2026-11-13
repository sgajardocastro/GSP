const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 10000
  });

  const runSql = async (sql) => {
    const escapedSql = sql.replace(/"/g, '\\"');
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"${escapedSql}\\""`);
    return res.stdout.trim();
  };

  console.log('1. ACREDITACION DOCS PROY 3:');
  const a = await runSql('SELECT count(*), json_agg(row_to_json(t)) FROM sch_leangsp_prod.tpry_acreditacion_doc t WHERE id_proyecto = 3;');
  console.log(a);

  console.log('2. TFMG ARCHIVOS RECIENTES (ULTIMOS 30):');
  const allTfmg = await runSql('SELECT id_doc, name_doc_orig, path_doc, tipo_doc FROM sch_leangsp_prod.tfmg_file ORDER BY id_doc DESC LIMIT 30;');
  console.log(allTfmg);

  console.log('3. DISCO /var/www /uploads o /almacenamiento_gsp:');
  const findFiles = await ssh.execCommand('find /var/www -name "*766-003*" -o -name "*Finning*" 2>/dev/null');
  console.log('ARCHIVOS EN DISCO:', findFiles.stdout);

  ssh.dispose();
}

run().catch(console.error);
