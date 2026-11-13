const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();
async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- REVISANDO ARCHIVO 1434 ---');
  const f = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT 'sch_leangsp' as s, id_file, file_name, file_path, id_proyecto, created_at FROM sch_leangsp.tfmg_file WHERE id_file = 1434 UNION ALL SELECT 'sch_leangsp_prod' as s, id_file, file_name, file_path, id_proyecto, created_at FROM sch_leangsp_prod.tfmg_file WHERE id_file = 1434;\\""`);
  console.log(f.stdout);

  console.log('--- ULTIMOS ARCHIVOS EN PROD ---');
  const fProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_file, file_name, file_path, id_proyecto, created_at FROM sch_leangsp_prod.tfmg_file ORDER BY id_file DESC LIMIT 5;\\""`);
  console.log(fProd.stdout);

  console.log('--- ULTIMOS ARCHIVOS EN DEV ---');
  const fDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_file, file_name, file_path, id_proyecto, created_at FROM sch_leangsp.tfmg_file ORDER BY id_file DESC LIMIT 5;\\""`);
  console.log(fDev.stdout);

  ssh.dispose();
}
run();
